import { createSignal, createEffect, Show } from 'solid-js';
import { Motion } from '@motionone/solid';
import documentsStore from "../_store/documentStore.jsx";

const SwitchSelector = () => {
  const { documentStore, setDocumentStore } = documentsStore;
  const [documents, setDocuments] = createSignal([]);
  const [currentDocIndex, setCurrentDocIndex] = createSignal(0);

  createEffect(() => {
    const docs = ['uploadedFile1', 'uploadedFile2']
      .map(key => localStorage.getItem(key))
      .filter(Boolean);
    
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
        <div class="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-full p-1 flex shadow-lg">
          <Motion.div
            animate={{
              x: `${currentDocIndex() * 100}%`,
              transition: { duration: 0.3, easing: 'ease-in-out' }
            }}
            class="absolute top-1 left-1 w-1/2 h-[calc(100%-8px)] bg-white bg-opacity-30 rounded-full"
          />
          {documents().map((_, index) => (
            <DocumentButton 
              index={index} 
              currentIndex={currentDocIndex()} 
              onClick={switchDocument} 
            />
          ))}
        </div>
      </div>
    </Show>
  );
};

const DocumentButton = ({ index, currentIndex, onClick }) => (
  <button
    onClick={() => onClick(index)}
    class={`py-2 px-4 rounded-full transition-all duration-300 ease-in-out relative z-10 ${
      currentIndex === index
        ? 'text-black'
        : 'text-gray-600 hover:text-black'
    }`}
  >
    Doc {index + 1}
  </button>
);

export default SwitchSelector;
