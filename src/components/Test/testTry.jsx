import { createSignal, Show, onMount } from 'solid-js';
import { ImSpinner8 } from 'solid-icons/im';
import { Toaster } from 'solid-toast';
import '../../output.css';
import { useParams } from '@solidjs/router';
import history from '../../history';
import { format, parseISO } from 'date-fns';
import { FaSolidChevronDown, FaSolidChevronUp } from 'solid-icons/fa';
import documentsStore from "../_store/documentStore.jsx";
import SwitchSelector from "../switchSelector/switchSelector.jsx";

function TestTry() {
  const [testState, setTestState] = createSignal(null);
  const [evalLog, setEvalLog] = createSignal(null);
  const [processingTest, setProcessingTest] = createSignal(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [expandedResult, setExpandedResult] = createSignal(false);
  const [showPrompt, setShowPrompt] = createSignal({});
  const params = useParams();
  const { documentStore } = documentsStore;

  onMount(() => {
    const storedFile = documentStore();
    if (!storedFile) {
      setError('No file uploaded');
      setIsLoading(false);
      return;
    }

    try {
      const { test_states, eval_logs, processing_tests } = JSON.parse(storedFile);

      if (!Array.isArray(test_states) || !Array.isArray(eval_logs) || !Array.isArray(processing_tests)) {
        throw new Error('Invalid file structure: arrays not found');
      }

      const testId = params.testId === "sample_test" ? "0" : params.testId;
      const currentState = test_states.find(state => state.test_id === testId && state.id == params.testTry);
      
      if (!currentState) {
        throw new Error('Test state not found');
      }

      setTestState(currentState);

      const relatedEvalLog = eval_logs.find(log => log.id.toString() === currentState.id.toString());
      if (!relatedEvalLog) {
        throw new Error('Evaluation log not found');
      }
      setEvalLog(relatedEvalLog);

      const relatedProcessingTest = processing_tests.find(test => test.related_eval_log_id === relatedEvalLog.id);
      if (!relatedProcessingTest) {
        throw new Error('Processing test not found');
      }
      setProcessingTest(relatedProcessingTest);

    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to parse stored file');
    } finally {
      setIsLoading(false);
    }
  });

  const handleHomeClick = () => history.push('/');
  const handleTestIdClick = () => history.push(`/test/${params.testId}`);

  const togglePrompt = (role) => setShowPrompt(prev => ({ ...prev, [role]: !prev[role] }));
  const toggleExpandResult = () => setExpandedResult(prev => !prev);

  return (
    <>
      <style>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0a1020; border-radius: 5px; }
        ::-webkit-scrollbar-thumb { background: #212a3b; border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: #2c3a52; }
        .message-hover:hover { opacity: 0.8; cursor: pointer; }
        .processing-result { max-width: 300px; overflow-x: auto; white-space: nowrap; }
        .processing-result-expanded { white-space: normal; word-wrap: break-word; }
      `}</style>
      <SwitchSelector />
      <div class="fixed top-0 left-0 z-20 p-1 pl-4">
        <nav class="text-sm font-bold text-gray-400">
          <span class="cursor-pointer hover:text-white transition-colors duration-300" onClick={handleHomeClick}>
            test
          </span>
          <span class="mx-2">&gt;</span>
          <span class="cursor-pointer hover:text-white transition-colors duration-300" onClick={handleTestIdClick}>
            {params.testId}
          </span>
          <span class="mx-2">&gt;</span>
          <span class="text-gray-400">{params.testTry}</span>
        </nav>
      </div>
      <div class="flex min-h-screen bg-[#030816] p-8 pt-16">
        <Toaster />
        <Show when={!isLoading()} fallback={<ImSpinner8 class="animate-spin h-10 w-10 text-[#212a3b]" />}>
          <Show when={!error()} fallback={<p class="text-red-500">{error()}</p>}>
            <div class="flex w-full max-w-full mx-auto overflow-hidden">
              <div class="w-[60%] pr-4 overflow-y-auto" style="max-width: 60%;">
                <h1 class="text-4xl font-bold text-white mb-8">TEST {params.testId} - Try {testState()?.tries_run}</h1>
                
                <div class="grid grid-cols-2 gap-4 mb-8">
                  <InfoCard title="GPS" content={evalLog()?.next_gps || 'N/A'} />
                  <InfoCard 
                    title="Timestamp" 
                    content={evalLog()?.timestamp ? format(parseISO(evalLog().timestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A'} 
                  />
                </div>

                <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-6 mb-8">
                  <h2 class="text-2xl font-bold text-white mb-4">Processing Result</h2>
                  <div 
                    class={`processing-result text-white ${expandedResult() ? 'processing-result-expanded' : ''}`}
                    onClick={toggleExpandResult}
                  >
                    {processingTest()?.result[0] || 'N/A'}
                    {expandedResult() ? 
                      <FaSolidChevronUp class="inline-block ml-2" /> : 
                      <FaSolidChevronDown class="inline-block ml-2" />
                    }
                  </div>
                </div>
              </div>

              <div class="w-[40%] pl-4" style="max-width: 40%;">
                <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-6 flex flex-col">
                  <h2 class="text-2xl font-bold text-white mb-4">Chat History</h2>
                  <div class="overflow-y-auto flex-grow" style="max-height: calc(100vh - 12rem);">
                    <div class="flex flex-col space-y-4 mb-4">
                      <ChatMessage 
                        role="student"
                        content={evalLog()?.output_student}
                        prompt={evalLog()?.prompt_student}
                        timestamp={evalLog()?.timestamp}
                        showPrompt={showPrompt().student}
                        togglePrompt={() => togglePrompt('student')}
                      />
                      <ChatMessage 
                        role="mentor"
                        content={evalLog()?.output_mentor}
                        prompt={evalLog()?.prompt_mentor}
                        timestamp={evalLog()?.timestamp}
                        showPrompt={showPrompt().mentor}
                        togglePrompt={() => togglePrompt('mentor')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </Show>
      </div>
    </>
  );
}

const InfoCard = ({ title, content }) => (
  <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-4 cursor-default transition-all duration-300 hover:opacity-80">
    <p class="text-white font-bold">{title}</p>
    <p class="text-white">{content}</p>
  </div>
);

const ChatMessage = ({ role, content, prompt, timestamp, showPrompt, togglePrompt }) => (
  <div class={`flex items-start ${role === 'mentor' ? 'justify-end' : ''}`}>
    {role === 'student' && <Avatar letter="S" bgColor="bg-blue-500" />}
    <div 
      class={`p-3 rounded-2xl max-w-[80%] cursor-pointer transition-opacity duration-300 hover:opacity-80 ${
        showPrompt ? 'bg-gray-700' : (role === 'student' ? 'bg-blue-100' : 'bg-green-100')
      }`}
      onClick={togglePrompt}
    >
      <p class={`text-sm break-words ${showPrompt ? 'text-white' : 'text-gray-800'}`}>
        {showPrompt ? prompt : content}
      </p>
      <p class={`text-xs ${showPrompt ? 'text-gray-400' : 'text-gray-500'} text-right mt-1`}>
        {timestamp ? format(parseISO(timestamp), 'HH:mm') : 'Time not available'}
      </p>
    </div>
    {role === 'mentor' && <Avatar letter="M" bgColor="bg-green-500" />}
  </div>
);

const Avatar = ({ letter, bgColor }) => (
  <div class={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center text-white font-bold ${letter === 'S' ? 'mr-2' : 'ml-2'} flex-shrink-0`}>
    {letter}
  </div>
);

export default TestTry;
