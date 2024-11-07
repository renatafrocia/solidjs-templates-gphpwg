import { createSignal, Show, onMount, For, createMemo, createEffect } from 'solid-js';
import { ImSpinner8 } from 'solid-icons/im';
import toast, { Toaster } from 'solid-toast';
import '../../output.css';
import { useNavigate } from '@solidjs/router';
import history from '../../history';
import { format, differenceInSeconds } from 'date-fns';
import { Line, Bar } from 'solid-chartjs';
import { Chart, registerables } from 'chart.js';
import documentsStore from "../_store/documentStore.jsx";
import SwitchSelector from "../switchSelector/switchSelector.jsx";

Chart.register(...registerables);

function Sessions() {
  const [sessionData, setSessionData] = createSignal([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [view, setView] = createSignal('drill-down');
  const [sortCriteria, setSortCriteria] = createSignal({ field: 'id', direction: 'asc' });
  const [filterCriteria, setFilterCriteria] = createSignal({});
  const navigate = useNavigate();
  const { documentStore, setDocumentStore } = documentsStore;

  onMount(async () => {
    // Add small delay to ensure store is properly initialized
    await new Promise(resolve => setTimeout(resolve, 100));
    loadDataFromStore();
  });

  const loadDataFromStore = () => {
    const storedFile = documentStore();
    if (storedFile) {
      try {
        const parsedFile = JSON.parse(storedFile);
        if (parsedFile.eval_logs && Array.isArray(parsedFile.eval_logs)) {
          const processedData = parsedFile.eval_logs.map(log => ({
            id: log.id,
            conversation_id: log.conversation_id,
            tokens_used: log.input_query.split(' ').length + log.output_response.split(' ').length,
            student_id: log.student_id,
            mentor_id: log.mentor_id,
            next_gps: log.next_gps || 'N/A'
          }));
          setSessionData(processedData);
        } else {
          setError('Invalid file structure: eval_logs array not found');
        }
      } catch (e) {
        setError('Failed to parse stored file');
      }
    } else {
      setError('No file uploaded');
    }
    setIsLoading(false);
  };

  const sortedSessions = createMemo(() => {
    return [...sessionData()].sort((a, b) => {
      const field = sortCriteria().field;
      const direction = sortCriteria().direction === 'asc' ? 1 : -1;
      if (a[field] < b[field]) return -1 * direction;
      if (a[field] > b[field]) return 1 * direction;
      return 0;
    });
  });

  const handleUpload = () => {
    history.push('/upload');
  };

  const handleSessionClick = (sessionId) => {
    const storedFile = documentStore();
    if (storedFile) {
      const parsedFile = JSON.parse(storedFile);
      const testState = parsedFile.test_states.find(state => state.id === sessionId);
      if (testState) {
        navigate(`/sessions/${testState.test_id}`);
      } else {
        console.error('Test state not found for session ID:', sessionId);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterCriteria(prev => ({ ...prev, [name]: value }));
  };

  createEffect(() => {
    console.log('Filter criteria changed:', filterCriteria());
  });

  createEffect(() => {
    console.log('Sort criteria changed:', sortCriteria());
  });

  return (
    <>
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
        .session-row {
          transition: all 0.3s ease;
        }
        .session-row:hover {
          background-color: #1a2030;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      <SwitchSelector />
      <div class="fixed top-0 left-0 z-20 p-1 pl-4">
        <nav class="text-sm font-bold text-gray-400">
          <span 
            class="cursor-pointer hover:text-white transition-colors duration-300" 
            onClick={() => history.push('/')}
          >
            test
          </span>
          <span class="mx-2">&gt;</span>
          <span class="text-gray-600">sessions</span>
        </nav>
      </div>
      <div class="flex flex-col items-center justify-center min-h-screen bg-[#030816] p-8 pt-12">
        <Toaster />
        <div class="mb-8">
          <button 
            class={`px-4 py-2 rounded-l-lg border border-[#212a3b] text-white ${view() === 'overview' ? 'bg-[#212a3b]' : 'bg-[#030816]'}`}
            onClick={() => history.push('/')}
          >
            Overview
          </button>
          <button 
            class={`px-4 py-2 rounded-r-lg border border-[#212a3b] text-white ${view() === 'drill-down' ? 'bg-[#212a3b]' : 'bg-[#030816]'}`}
            onClick={() => setView('drill-down')}
          >
            Session Drill-Down
          </button>
        </div>
        <Show when={!isLoading()} fallback={<ImSpinner8 class="animate-spin h-10 w-10 text-[#212a3b]" />}>
          <Show 
            when={!error()} 
            fallback={
              <div class="text-center">
                <p class="text-red-500 mb-4">{error()}</p>
                <button 
                  class="bg-[#212a3b] hover:bg-[#2c3a52] text-white font-bold py-2 px-4 rounded border border-[#212a3b]"
                  onClick={handleUpload}
                >
                  Upload a File
                </button>
              </div>
            }
          >
            <div class="w-full max-w-6xl">
              <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-4 mb-4 flex justify-between items-center text-white">
                <div class="font-semibold w-1/6 cursor-pointer" onClick={() => handleSortChange('id')}>
                  Test ID {sortCriteria().field === 'id' && (sortCriteria().direction === 'asc' ? '▲' : '▼')}
                </div>
                <div class="font-semibold w-1/6 cursor-pointer" onClick={() => handleSortChange('conversation_id')}>
                  Conversation ID {sortCriteria().field === 'conversation_id' && (sortCriteria().direction === 'asc' ? '▲' : '▼')}
                </div>
                <div class="font-semibold w-1/6 cursor-pointer" onClick={() => handleSortChange('tokens_used')}>
                  Tokens Used {sortCriteria().field === 'tokens_used' && (sortCriteria().direction === 'asc' ? '▲' : '▼')}
                </div>
                <div class="font-semibold w-1/6 cursor-pointer" onClick={() => handleSortChange('student_id')}>
                  Student ID {sortCriteria().field === 'student_id' && (sortCriteria().direction === 'asc' ? '▲' : '▼')}
                </div>
                <div class="font-semibold w-1/6 cursor-pointer" onClick={() => handleSortChange('mentor_id')}>
                  Mentor ID {sortCriteria().field === 'mentor_id' && (sortCriteria().direction === 'asc' ? '▲' : '▼')}
                </div>
                <div class="font-semibold w-1/6 cursor-pointer" onClick={() => handleSortChange('next_gps')}>
                  Next GPS {sortCriteria().field === 'next_gps' && (sortCriteria().direction === 'asc' ? '▲' : '▼')}
                </div>
              </div>
              <div class="overflow-y-auto max-h-[calc(100vh-300px)]">
                <For each={sortedSessions()}>
                  {(session) => (
                    <div 
                      class="session-row bg-[#0a1020] rounded-lg border border-[#212a3b] p-4 mb-2 flex justify-between items-center text-white cursor-pointer"
                      onClick={() => handleSessionClick(session.id)}
                    >
                      <div class="w-1/6">{session.id}</div>
                      <div class="w-1/6">{session.conversation_id}</div>
                      <div class="w-1/6">{session.tokens_used}</div>
                      <div class="w-1/6">{session.student_id}</div>
                      <div class="w-1/6">{session.mentor_id}</div>
                      <div class="w-1/6">{session.next_gps}</div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </Show>
      </div>
    </>
  );
}

export default Sessions;
