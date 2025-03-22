import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../shared/header";
import { PROJECT_SCHEMA_UPDATE_URL, SINGLE_PROJECT_URL } from "../shared/constants/constants";

interface Schema {
  id: string;
  name: string;
  description?: string;
  schema_type: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  schemas: Schema[];
}

const ProjectPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    schemaId: string;
    field: string;
    value: string;
    oldValue: string;
  } | null>(null);
  const [updatedSchemas, setUpdatedSchemas] = useState<Schema[]>([]);
  const [hoveredField, setHoveredField] = useState<{
    schemaId: string;
    fieldName: string;
  } | null>(null);
  const [editedSchemas, setEditedSchemas] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${SINGLE_PROJECT_URL}${projectId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }

        const data = await response.json();
        setProject(data);
        setUpdatedSchemas(data.schemas);
      } catch (error) {
        console.error("Error fetching project:", error);
        setError("Failed to load project. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleEdit = (schemaId: string, field: string, value: string) => {
    console.log("Editing:", { schemaId, field, value });
    setEditing({ schemaId, field, value, oldValue: value });
  };

  const handleSave = (schemaId: string, field: string, newValue: string) => {
    if (!newValue.trim()) {
      setEditing(null);
      return;
    }

    if (editing && newValue === editing.oldValue) {
      setEditing(null);
      return;
    }

    const updatedSchema = updatedSchemas.map((schema) => {
      if (schema.id === schemaId) {
        if (
          field === "name" ||
          field === "description" ||
          field === "schema_type"
        ) {
          return {
            ...schema,
            [field]: newValue,
          };
        }

        return {
          ...schema,
          fields: schema.fields.map((f) =>
            f.name === field.split("-")[1] ? { ...f, [field.split("-")[0]]: newValue } : f
          ),
        };
      }
      return schema;
    });

    setUpdatedSchemas(updatedSchema);
    setEditing(null);

    setEditedSchemas((prev) => new Set(prev).add(schemaId));
  };

  const handleUpdate = async (schemaId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${PROJECT_SCHEMA_UPDATE_URL}${projectId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ schemas: updatedSchemas }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      window.location.reload();
      setEditedSchemas((prev) => {
        const newSet = new Set(prev);
        newSet.delete(schemaId);
        return newSet;
      });
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project. Please try again.");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header showProjectTitle={true} projectTitle={project.name.replace(/['"]+/g, "")} userImageSrc="/assets/user1.png" />
      <main className="flex-grow p-10 h-full flex flex-col">
        <div className="w-full">
          {/* <h1 className="text-2xl font-bold mb-6">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 mb-4">{project.description}</p>
          )} */}

          {updatedSchemas.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Generated Schema</h2>
              <div className="gap-6 flex justify-center flex-wrap">
                {updatedSchemas.map((schema) => (
                  <div
                    key={schema.id}
                    className="bg-white rounded-lg border-2 border-gray-200 w-full md:w-[45%] lg:w-[30%] mb-6"
                  >
                    <h3 className="group flex justify-between text-xl font-semibold mb-4 table-header p-2 pl-4 rounded">
                      {editing?.schemaId === schema.id &&
                      editing?.field === "name" ? (
                        <input
                          type="text"
                          value={editing.value}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              value: e.target.value,
                            })
                          }
                          onBlur={() =>
                            handleSave(schema.id, "name", editing.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSave(schema.id, "name", editing.value);
                            }
                          }}
                          className="border border-gray-300 p-1 rounded"
                          autoFocus
                        />
                      ) : (
                        <>
                          {schema.name}
                          <img
                            src="/assets/pencil.png"
                            alt="pencil"
                            className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() =>
                              handleEdit(schema.id, "name", schema.name)
                            }
                          />
                        </>
                      )}
                    </h3>
                    {schema.description && (
                      <p className="text-gray-600 mb-4 pl-4 flex justify-between group">
                        {editing?.schemaId === schema.id &&
                        editing?.field === "description" ? (
                          <input
                            type="text"
                            value={editing.value}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                value: e.target.value,
                              })
                            }
                            onBlur={() =>
                              handleSave(
                                schema.id,
                                "description",
                                editing.value
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSave(
                                  schema.id,
                                  "description",
                                  editing.value
                                );
                              }
                            }}
                            className="border border-gray-300 p-1 rounded"
                            autoFocus
                          />
                        ) : (
                          <>
                            {schema.description}
                            <img
                              src="/assets/pencil.png"
                              alt="pencil"
                              className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer"
                              onClick={() =>
                                handleEdit(
                                  schema.id,
                                  "description",
                                  schema.description || ""
                                )
                              }
                            />
                          </>
                        )}
                      </p>
                    )}
                    <div className="space-y-4">
                      {schema.fields.map((field, fieldIndex) => (
                        <div
                          key={fieldIndex}
                          className="px-4 pb-4 rounded-lg relative group"
                          onMouseEnter={() =>
                            setHoveredField({
                              schemaId: schema.id,
                              fieldName: field.name,
                            })
                          }
                          onMouseLeave={() => setHoveredField(null)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium flex justify-between gap-5">
                              {editing?.schemaId === schema.id &&
                              editing?.field === `name-${field.name}` ? (
                                <input
                                  type="text"
                                  value={editing.value}
                                  onChange={(e) =>
                                    setEditing({
                                      ...editing,
                                      value: e.target.value,
                                    })
                                  }
                                  onBlur={() =>
                                    handleSave(
                                      schema.id,
                                      `name-${field.name}`,
                                      editing.value
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSave(
                                        schema.id,
                                        `name-${field.name}`,
                                        editing.value
                                      );
                                    }
                                  }}
                                  className="border border-gray-300 p-1 rounded"
                                  autoFocus
                                />
                              ) : (
                                <>
                                  {field.name}
                                  {hoveredField?.schemaId === schema.id &&
                                    hoveredField?.fieldName === field.name && (
                                      <img
                                        src="/assets/pencil.png"
                                        alt="pencil"
                                        className="w-5 h-4 cursor-pointer"
                                        onClick={() =>
                                          handleEdit(
                                            schema.id,
                                            `name-${field.name}`,
                                            field.name
                                          )
                                        }
                                      />
                                    )}
                                </>
                              )}
                            </span>
                            <span className="text-sm flex justify-between gap-5">
                              {editing?.schemaId === schema.id &&
                              editing?.field === `type-${field.name}` ? (
                                <input
                                  type="text"
                                  value={editing.value}
                                  onChange={(e) =>
                                    setEditing({
                                      ...editing,
                                      value: e.target.value,
                                    })
                                  }
                                  onBlur={() =>
                                    handleSave(
                                      schema.id,
                                      `type-${field.name}`,
                                      editing.value
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSave(
                                        schema.id,
                                        `type-${field.name}`,
                                        editing.value
                                      );
                                    }
                                  }}
                                  className="border border-gray-300 p-1 rounded"
                                  autoFocus
                                />
                              ) : (
                                <>
                                  {field.type}
                                  {hoveredField?.schemaId === schema.id &&
                                    hoveredField?.fieldName === field.name && (
                                      <img
                                        src="/assets/pencil.png"
                                        alt="pencil"
                                        className="w-5 h-4 cursor-pointer"
                                        onClick={() =>
                                          handleEdit(
                                            schema.id,
                                            `type-${field.name}`,
                                            field.type
                                          )
                                        }
                                      />
                                    )}
                                </>
                              )}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 flex justify-between gap-5">
                            {field.required ? "Required" : "Optional"}:{" "}
                            {editing?.schemaId === schema.id &&
                            editing?.field ===
                              `description-${field.name}` ? (
                              <input
                                type="text"
                                value={editing.value}
                                onChange={(e) =>
                                  setEditing({
                                    ...editing,
                                    value: e.target.value,
                                  })
                                }
                                onBlur={() =>
                                  handleSave(
                                    schema.id,
                                    `description-${field.name}`,
                                    editing.value
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSave(
                                      schema.id,
                                      `description-${field.name}`,
                                      editing.value
                                    );
                                  }
                                }}
                                className="border border-gray-300 p-1 rounded"
                                autoFocus
                              />
                            ) : (
                              <>
                                {field.description}
                                {hoveredField?.schemaId === schema.id &&
                                  hoveredField?.fieldName === field.name && (
                                    <img
                                      src="/assets/pencil.png"
                                      alt="pencil"
                                      className="w-5 h-4 cursor-pointer"
                                      onClick={() =>
                                        handleEdit(
                                          schema.id,
                                          `description-${field.name}`,
                                          field.description || ""
                                        )
                                      }
                                    />
                                  )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {editedSchemas.has(schema.id) && (
                      <button
                        onClick={() => handleUpdate(schema.id)}
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Update
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No schemas found for this project.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectPage;