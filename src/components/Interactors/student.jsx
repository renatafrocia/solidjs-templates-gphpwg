import { createSignal, Show, onMount, For, createEffect } from 'solid-js';
import { ImSpinner8 } from 'solid-icons/im';
import toast, { Toaster } from 'solid-toast';
import '../../output.css';
import { useParams, useNavigate } from '@solidjs/router';
import { FaSolidChevronDown, FaSolidChevronUp } from 'solid-icons/fa';
import documentsStore from "../_store/documentStore.jsx";

const Student = () => {
  const [studentStages, setStudentStages] = createSignal([]);
  const [selectedStudent, setSelectedStudent] = createSignal(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [expandedStages, setExpandedStages] = createSignal({});
  const params = useParams();
  const navigate = useNavigate();
  const { documentStore, setDocumentStore } = documentsStore;

  const handleHomeClick = () => navigate('/');

  const toggleExpandStage = (stageId) => {
    setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const fetchStudentData = () => {
    const storedFile = documentStore();
    if (!storedFile) {
      setError('No file uploaded');
      setIsLoading(false);
      return;
    }

    try {
      const parsedFile = JSON.parse(storedFile);
      const { student_gpsms } = parsedFile;

      if (!Array.isArray(student_gpsms)) {
        throw new Error('Invalid file structure: student_gpsms array not found');
      }

      const studentId = params.studentId.replace(/_/g, '.');
      const filteredStages = student_gpsms.filter(stage => stage.sgpsm_student_id === studentId);
      
      setStudentStages(filteredStages);
      if (filteredStages.length > 0) {
        setSelectedStudent(filteredStages[0]);
      } else {
        setError('No stages found for this student');
      }
    } catch (e) {
      setError(e.message || 'Failed to parse stored file');
    } finally {
      setIsLoading(false);
    }
  };

  onMount(fetchStudentData);

  createEffect(() => {
    if (params.studentId) {
      fetchStudentData();
    }
  });

  const StudentStage = ({ stage }) => (
    <div class="mb-4 transition-all duration-300 hover:transform hover:scale-102">
      <div 
        class="flex justify-between items-center p-4 bg-gradient-to-r from-[#1a2234] to-[#2c3a52] rounded-lg cursor-pointer shadow-md hover:shadow-lg transition-all duration-300"
        onClick={() => toggleExpandStage(stage.sgpsm_id)}
      >
        <span class="text-white font-bold text-lg">{stage.sgpsm_id} - {stage.sgpsm_short_title}</span>
        {expandedStages()[stage.sgpsm_id] ? 
          <FaSolidChevronUp class="text-white text-xl" /> : 
          <FaSolidChevronDown class="text-white text-xl" />
        }
      </div>
      <Show when={expandedStages()[stage.sgpsm_id]}>
        <div class="mt-2 p-4 bg-[#0a1020] rounded-lg border border-[#212a3b] shadow-inner">
          <pre class="text-white overflow-x-auto whitespace-pre-wrap text-sm">
            {JSON.stringify(stage, null, 2)}
          </pre>
        </div>
      </Show>
    </div>
  );

  return (
    <div class="min-h-screen bg-gradient-to-b from-[#030816] to-[#0a1020] text-white">
      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0a1020;
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb {
          background: #3d4b66;
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #4d5d7f;
        }
      `}</style>
      <nav class="fixed top-0 left-0 z-20 w-full bg-[#0a1020] p-4 shadow-md">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <span 
            class="cursor-pointer hover:text-blue-400 transition-colors duration-300 text-lg" 
            onClick={handleHomeClick}
          >
            Home
          </span>
          <span class="font-bold text-xl">{params.studentId.replace(/_/g, '.')}</span>
        </div>
      </nav>
      <main class="pt-20 p-8">
        <Toaster />
        <Show when={!isLoading()} fallback={<ImSpinner8 class="animate-spin h-16 w-16 text-[#3d4b66] mx-auto" />}>
          <Show when={!error()} fallback={<p class="text-red-500 text-center text-xl">{error()}</p>}>
            <div class="flex flex-col lg:flex-row max-w-7xl mx-auto gap-8">
              <section class="lg:w-3/5">
                <h1 class="text-5xl font-bold mb-8 text-center lg:text-left">STUDENT {params.studentId.replace(/_/g, '.')}</h1>
                <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-6 mb-8 shadow-lg">
                  <h2 class="text-3xl font-bold mb-6">Student Stages</h2>
                  <div class="overflow-y-auto max-h-[calc(100vh-20rem)] pr-2">
                    <For each={studentStages()}>
                      {(stage) => <StudentStage stage={stage} />}
                    </For>
                  </div>
                </div>
              </section>
              <section class="lg:w-2/5">
                <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-6 sticky top-24 shadow-lg">
                  <h2 class="text-3xl font-bold mb-6">Raw JSON</h2>
                  <div class="overflow-y-auto" style="max-height: calc(100vh - 14rem);">
                    <pre class="text-white overflow-x-auto whitespace-pre-wrap text-sm">
                      {JSON.stringify(selectedStudent(), null, 2)}
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

export default Student;
