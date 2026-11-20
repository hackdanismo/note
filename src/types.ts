export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
};
export type Folder = { id: string; name: string; createdAt: string };
