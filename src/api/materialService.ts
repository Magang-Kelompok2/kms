const API_BASE = import.meta.env.VITE_API_URL ?? "";

export type MaterialUploadPayload = {
  title: string;
  classId: string;
  type: string;
  description?: string;
};

export async function fetchMaterials() {
  const res = await fetch(`${API_BASE}/api/materials`);
  if (!res.ok) throw new Error("Failed to fetch materials");
  return res.json();
}

export async function uploadMaterial(file: File, metadata: MaterialUploadPayload) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", metadata.title);
  formData.append("classId", metadata.classId);
  formData.append("type", metadata.type);
  if (metadata.description) formData.append("description", metadata.description);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Upload failed");
  }

  return res.json();
}
