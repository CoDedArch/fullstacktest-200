import uuid
import json
from typing import List, Optional,Dict
from pydantic import ValidationError
from apps.databaseSchemas.schemas import DatabaseSchema
from core.config import settings
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


schema_prompt = """
You are a database schema generation assistant. Given a description of a project or a question about a project, generate a database schema that meets the requirements.

## Instructions
1. If the user provides a project description, generate a database schema based on the description.
2. If the user asks a question, interpret the question as a request to modify or refine the schema, and generate a schema based on the implied requirements.
3. Do not answer the user's question directly. Instead, always generate a schema that reflects the intent of the question or description.
4. The schema must be SQL-compatible and adhere to SQL standards.

## Output Format
For each table, provide:
- name: The name of the table
- fields: A list of fields, each with:
  - name: The name of the field
  - type: The data type of the field (e.g., string, integer, boolean)
  - required: Whether the field is required (default: true)
  - description: A description of the field (optional)
- description: A description of the table (optional)

## Rules
1. Use clear and concise names for tables and fields.
2. Include only fields that are necessary for the project.
3. Use appropriate SQL data types for each field (e.g., VARCHAR, INTEGER, BOOLEAN, DATE, etc.).
4. Provide descriptions for tables and fields where necessary.
5. Do not answer questions directly. Always generate a schema.
6. The schema must be SQL-compatible and adhere to SQL standards.

## SQL-Specific Rules
1. Table and field names must be valid SQL identifiers (e.g., alphanumeric, underscores, no spaces).
2. Use standard SQL data types (e.g., VARCHAR, INTEGER, BOOLEAN, DATE, TIMESTAMP, FLOAT, etc.).
3. Define primary keys for each table using the `id` field.
4. Use foreign keys to define relationships between tables.
5. Avoid using reserved SQL keywords for table or field names.

## Output Structure
{
    "tables": [
        {
            "name": "users",
            "fields": [
                {
                    "name": "id",
                    "type": "INTEGER",
                    "required": true,
                    "description": "Primary key for the user"
                },
                {
                    "name": "username",
                    "type": "VARCHAR(255)",
                    "required": true,
                    "description": "Username for the user"
                }
            ],
            "description": "Table for storing user information"
        }
    ],
    "follow_up_question": "Does this schema look good to you? If not, what changes would you like to make?"
}
"""

def generate_project_url() -> str:
    """Generates a unique URL for the project."""
    return f"https://project-schema/{uuid.uuid4()}"

async def generate_schema(
    project_description: str,
    conversation_state: Dict,
    user_feedback: Optional[str] = None,
) -> Optional[DatabaseSchema]:
    """
    Generates or modifies a database schema based on the project description and user feedback.
    If the user types "yes", returns the existing schema without modification.
    The Schema generated must be SQL-compatible and adhere to SQL standards.
    """

    if user_feedback and user_feedback.strip().lower() == "yes":
        if "generated_schema" in conversation_state:
            return conversation_state["generated_schema"], conversation_state
        else:
            return None, conversation_state

    project_title = None
    if conversation_state["is_first_prompt"]:
        try:
            completion_title = await client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Extract a short and meaningful project title from the given description."},
                    {"role": "user", "content": project_description},
                ],
            )
            project_title = completion_title.choices[0].message.content.strip()
        except Exception as e:
            project_title = "Generated Schema"

    try:
        if conversation_state["is_first_prompt"]:
            completion = await client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": schema_prompt},
                    {"role": "user", "content": project_description},
                ],
            )
        else:
            completion = await client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": schema_prompt},
                    {"role": "assistant", "content": json.dumps(conversation_state["generated_schema"].model_dump())},
                    {"role": "user", "content": user_feedback},
                ],
            )

        schema_json = completion.choices[0].message.content

        try:
            schema_data = json.loads(schema_json)
        except json.JSONDecodeError:
            return None, {
                **conversation_state,
                "follow_up_question": "Your feedback was unclear. Please provide more specific instructions.",
            }

        # Add missing fields if necessary
        if "follow_up_question" not in schema_data:
            schema_data["follow_up_question"] = "Does this schema look good to you? If not, what changes would you like to make?"
        schema_data["project_title"] = project_title
        schema_data["project_url"] = generate_project_url()

        schema = DatabaseSchema.model_validate(schema_data)
        print(schema)

        # Update conversation state
        conversation_state["generated_schema"] = schema

        follow_up_question = schema_data.get("follow_up_question", "Does this schema look good to you? If not, what changes would you like to make?")
        conversation_state["follow_up_question"] = follow_up_question

        # Set is_first_prompt to False only after the after a follow up
        if not conversation_state["is_first_prompt"]:
            conversation_state["is_first_prompt"] = False

        return schema, conversation_state

    except ValidationError as e:
        print(f"Validation error in schema JSON: {str(e)}")
        return None, conversation_state
    except Exception as e:
        print(f"Error generating schema: {str(e)}")
        return None, conversation_state