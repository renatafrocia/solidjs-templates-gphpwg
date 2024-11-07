import { createSignal, Show, onMount, For, createEffect } from 'solid-js';
import { ImSpinner8 } from 'solid-icons/im';
import toast, { Toaster } from 'solid-toast';
import '../../output.css';
import { useParams, useNavigate } from '@solidjs/router';
import { FaSolidChevronDown, FaSolidChevronUp } from 'solid-icons/fa';
import documentsStore from "../_store/documentStore.jsx";

const Mentor = () => {
  const [mentorStages, setMentorStages] = createSignal([]);
  const [selectedMentor, setSelectedMentor] = createSignal(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [expandedStages, setExpandedStages] = createSignal({});
  const params = useParams();
  const { documentStore, setDocumentStore } = documentsStore;

  const handleHomeClick = () => history.push('/');

  const toggleExpandStage = (stageId) => {
    setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const fetchMentorData = () => {
    const storedFile = documentStore();
    console.log(storedFile)
    if (!storedFile) {
      setError('No file uploaded');
      setIsLoading(false);
      return;
    }

    try {
      const parsedFile = JSON.parse(storedFile);
      const { gpsms } = parsedFile;

      if (!Array.isArray(gpsms)) {
        throw new Error('Invalid file structure: gpsms array not found');
      }

      const mentorId = params.mentorId.replace(/_/g, '.');
      const filteredStages = gpsms.filter(stage => stage.metadata.mentorCode === mentorId);
      
      setMentorStages(filteredStages);
      if (filteredStages.length > 0) {
        setSelectedMentor(filteredStages[0]);
      } else {
        setError('No stages found for this mentor');
      }
    } catch (e) {
      setError(e.message || 'Failed to parse stored file');
    } finally {
      setIsLoading(false);
    }
  };

  onMount(fetchMentorData);

  createEffect(() => {
    if (params.mentorId) {
      fetchMentorData();
    }
  });

  const MentorStage = ({ stage }) => (
    <div class="mb-4">
      <div 
        class="flex justify-between items-center p-4 bg-[#1a2234] rounded-lg cursor-pointer transition-all duration-300 hover:bg-[#2c3a52]"
        onClick={() => toggleExpandStage(stage.gpsId)}
      >
        <span class="text-white font-bold">{stage.gpsId} - {stage.context.shortTitle}</span>
        {expandedStages()[stage.gpsId] ? 
          <FaSolidChevronUp class="text-white" /> : 
          <FaSolidChevronDown class="text-white" />
        }
      </div>
      <Show when={expandedStages()[stage.gpsId]}>
        <div class="mt-2 p-4 bg-[#0a1020] rounded-lg border border-[#212a3b]">
          <pre class="text-white overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(stage, null, 2)}
          </pre>
        </div>
      </Show>
    </div>
  );

  return (
    <div class="min-h-screen bg-[#030816] text-white">
      <style>{`
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: #0a1020;
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb {
          background: #212a3b;
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #2c3a52;
        }
      `}</style>
      <nav class="fixed top-0 left-0 z-20 w-full bg-[#0a1020] p-4">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <span 
            class="cursor-pointer hover:text-blue-400 transition-colors duration-300" 
            onClick={handleHomeClick}
          >
            Home
          </span>
          <span class="font-bold">{params.mentorId.replace(/_/g, '.')}</span>
        </div>
      </nav>
      <main class="pt-16 p-8">
        <Toaster />
        <Show when={!isLoading()} fallback={<ImSpinner8 class="animate-spin h-10 w-10 text-[#212a3b] mx-auto" />}>
          <Show when={!error()} fallback={<p class="text-red-500 text-center">{error()}</p>}>
            <div class="flex flex-col lg:flex-row max-w-7xl mx-auto gap-8">
              <section class="lg:w-3/5">
                <h1 class="text-4xl font-bold mb-8">MENTOR {params.mentorId.replace(/_/g, '.')}</h1>
                <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-6 mb-8">
                  <h2 class="text-2xl font-bold mb-4">Mentor Stages</h2>
                  <div class="overflow-y-auto max-h-[calc(100vh-20rem)]">
                    <For each={mentorStages()}>
                      {(stage) => <MentorStage stage={stage} />}
                    </For>
                  </div>
                </div>
              </section>
              <section class="lg:w-2/5">
                <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-6 sticky top-20">
                  <h2 class="text-2xl font-bold mb-4">Raw JSON</h2>
                  <div class="overflow-y-auto" style="max-height: calc(100vh - 12rem);">
                    <pre class="text-white overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedMentor(), null, 2)}
                    </pre>
                  </div>
                </div>
              </section>
            </div>
          </Show>
        </Show>
      </main>
    </div>
  );
};

export default Mentor;
