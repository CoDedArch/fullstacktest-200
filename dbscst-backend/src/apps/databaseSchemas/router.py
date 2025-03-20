import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from sqlalchemy.future import select
from core.database import aget_db
from core.security import verify_api_key
from apps.auth.router import get_current_user
from apps.databaseSchemas.services import generate_schema
from apps.databaseSchemas.models import Project, Schema, User
from apps.databaseSchemas.schemas import  GenerateSchemaRequest, GeneratedSchemaResponse


router = APIRouter()
# In-memory store for conversation states (replace with Redis or DB in production)
conversation_states = {}

# This State will ensure that we don't keep creating new projects for every user feedback
same_project = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
@router.post("/api/generate-schema", response_model=GeneratedSchemaResponse)
async def generate_schema_endpoint(
    request: GenerateSchemaRequest,
    session: AsyncSession = Depends(aget_db),
    current_user: User = Depends(get_current_user),
):
    """
    Endpoint to generate or modify a database schema based on a project description or user feedback.

    Args:
        request (GenerateSchemaRequest): The request object containing:
            - project_description (str): The description of the project.
            - api_key (str): The API key for authentication.
            - conversation_id (str, optional): The ID of the ongoing conversation.
            - user_feedback (str, optional): Feedback provided by the user to refine the schema.
        session (AsyncSession): The database session.
        current_user (User): The currently authenticated user.

    Returns:
        GeneratedSchemaResponse: The response containing:
            - project_title (str): The title of the project.
            - tables (List[Dict]): The generated or updated schema tables.
            - follow_up_question (str): A question to guide the user for further refinement.
            - conversation_id (str): The ID of the ongoing conversation.

    Raises:
        HTTPException:
            - 400 Bad Request: If the project description is missing or invalid.
            - 403 Forbidden: If the API key is invalid.
            - 404 Not Found: If no project is found for the current user.
            - 500 Internal Server Error: If schema generation fails or an unexpected error occurs.
    """

    project_description = request.project_description
    api_key = request.api_key
    conversation_id = request.conversation_id
    user_feedback = request.user_feedback

    logger.info(f"project description: {project_description}")
    logger.info(f"api_key: {api_key}")
    logger.info(f"conversation_id: {conversation_id}")
    logger.info(f"user_feedback: {user_feedback}")

    if not verify_api_key(api_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API key"
        )

    if not project_description.strip() and not user_feedback:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Project description is required"
        )

    try:
        # Check if the user wants to finalize the project
        if user_feedback and user_feedback.strip().lower() == "yes":
            # Retrieve the latest project for the current user
            project = await session.execute(
                select(Project)
                .where(Project.user_id == current_user.id)
                .order_by(Project.created_at.desc())
                .limit(1)
            )
            project = project.scalars().first()

            if not project:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No project found for the current user",
                )

            # Retrieve the schemas associated with the project
            schemas = await session.execute(
                select(Schema).where(Schema.project_id == project.id)
            )
            schemas = schemas.scalars().all()

            # Convert schemas to the response format
            tables = []
            for schema in schemas:
                table = {
                    "name": schema.name,
                    "description": schema.description,
                    "fields": schema.fields,  # Assuming fields is a JSON-compatible list
                }
                tables.append(table)

            return GeneratedSchemaResponse(
                project_title=project.name,
                tables=tables,
                follow_up_question="Your project has been finalized!",
                conversation_id=conversation_id,
            )

        # If it's not a "yes", proceed with schema generation/modification
        # Retrieve or initialize conversation state
        if conversation_id and conversation_id in conversation_states:
            conversation_state = conversation_states[conversation_id]
            same_project = True
        else:
            same_project = False
            conversation_id = str(uuid.uuid4()) 
            conversation_state = {
                "is_first_prompt": True,
                "generated_schema": None,
                "follow_up_question": None,
            }
            conversation_states[conversation_id] = conversation_state

        # Generate or modify the schema
        schema, updated_conversation_state = await generate_schema(
            project_description, conversation_state, user_feedback
        )
        if not schema:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate schema",
            )
        
        if same_project:
            updated_conversation_state["is_first_prompt"] = False
            conversation_states[conversation_id] = updated_conversation_state

        if conversation_state["is_first_prompt"]:
            new_project = Project(
                user_id=current_user.id,
                name=schema.project_title or "Generated Schema",
                description=project_description,
            )
            session.add(new_project)
            await session.commit()
            await session.refresh(new_project)

            logger.info("Project Created Successfully")

            for table in schema.tables:
                fields_as_dicts = [field.model_dump() for field in table.fields]
                
                new_schema = Schema(
                    project_id=new_project.id,
                    name=table.name,
                    description=table.description or "",
                    schema_type="SQL",
                    fields=fields_as_dicts,
                )
                session.add(new_schema)

            await session.commit()
            logger.info("Schemas saved successfully!")
        else:
            # If it's not the first prompt, update the existing project and schemas
            # Retrieve the latest project for the current user
            project = await session.execute(
                select(Project)
                .where(Project.user_id == current_user.id)
                .order_by(Project.created_at.desc())
                .limit(1)
            )
            project = project.scalars().first()

            if not project:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No project found for the current user",
                )

            if project_description.strip():
                project.description = project_description
                await session.commit()

            await session.execute(delete(Schema).where(Schema.project_id == project.id))
            await session.commit()

            for table in schema.tables:
                fields_as_dicts = [field.model_dump() for field in table.fields]
                
                new_schema = Schema(
                    project_id=project.id,
                    name=table.name,
                    description=table.description or "",
                    schema_type="SQL",
                    fields=fields_as_dicts,
                )
                session.add(new_schema)

            await session.commit()
            logger.info("Schemas updated successfully!")

        return GeneratedSchemaResponse(
            project_title=schema.project_title or "Generated Schema",
            tables=[table.dict() for table in schema.tables],
            follow_up_question=schema.follow_up_question,
            conversation_id=conversation_id,
        )

    except Exception as e:
        logger.error(f"Error generating schema: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating schema: {str(e)}",
        )