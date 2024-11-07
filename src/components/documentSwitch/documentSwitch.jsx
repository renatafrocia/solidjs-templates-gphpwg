import { createSignal, createEffect, Show } from 'solid-js';
import documentStore from "../_store/documentStore.jsx";

const DocumentSwitch = () => {
  const { documentStore, setDocumentStore } = documentStore;
  const [documents, setDocuments] = createSignal([]);
  const [currentDocIndex, setCurrentDocIndex] = createSignal(0);

  createEffect(() => {
    const uploadedFile1 = localStorage.getItem('uploadedFile1');
    const uploadedFile2 = localStorage.getItem('uploadedFile2');
    const docs = [uploadedFile1, uploadedFile2].filter(Boolean);
    setDocuments(docs);
    if (docs.length > 0) {
      setDocumentStore(docs[0]);
    }
  });

  const switchDocument = (index) => {
    setCurrentDocIndex(index);
    setDocumentStore(documents()[index]);
  };

  return (
    <Show when={documents().length === 2}>
      <div class="fixed top-4 right-4 z-50">
        <div class="bg-[#0a1020] rounded-full p-1 flex shadow-lg">
          {documents().map((doc, index) => (
            <button
              onClick={() => switchDocument(index)}
              class={`py-2 px-4 rounded-full transition-all duration-300 ease-in-out ${
                currentDocIndex() === index
                  ? 'bg-[#2c3a52] text-white'
                  : 'bg-[#212a3b] text-gray-400 hover:bg-[#2c3a52] hover:text-white'
              }`}
            >
              Doc {index + 1}
            </button>
          ))}
        </div>
      </div>
    </Show>
  );
};

export default DocumentSwitch;


