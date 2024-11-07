import { createSignal, createRoot } from "solid-js";

function createDocumentsStore() {
  const initialValue = localStorage.getItem('documentStore') || '';
  localStorage.setItem('documentStore', initialValue);

  const [documentStore, setDocumentStore] = createSignal(initialValue);

  return { documentStore, setDocumentStore };
}

export default createRoot(createDocumentsStore);
