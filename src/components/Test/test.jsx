import { createSignal, Show, onMount, For } from 'solid-js';
import { ImSpinner8 } from 'solid-icons/im';
import toast, { Toaster } from 'solid-toast';
import '../../output.css';
import { useParams } from '@solidjs/router';
import history from '../../history';
import { format, isSameDay, parseISO } from 'date-fns';
import { FaSolidChevronDown, FaSolidChevronUp } from 'solid-icons/fa';
import documentsStore from "../_store/documentStore.jsx";
import SwitchSelector from "../switchSelector/switchSelector.jsx";

function Test() {
  const [testStates, setTestStates] = createSignal([]);
  const [evalLogs, setEvalLogs] = createSignal([]);
  const [processingTests, setProcessingTests] = createSignal([]);
  const [testDetails, setTestDetails] = createSignal(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [showPrompt, setShowPrompt] = createSignal({});
  const [expandedResults, setExpandedResults] = createSignal({});
  const params = useParams();
  const { documentStore, setDocumentStore } = documentsStore;  

  onMount(() => {
    const storedFile = documentStore();
    if (storedFile) {
      try {
        const parsedFile = JSON.parse(storedFile);
        const { test_states, eval_logs, processing_tests, tests } = parsedFile;

        if (!Array.isArray(test_states) || !Array.isArray(eval_logs) || !Array.isArray(processing_tests) || !Array.isArray(tests)) {
          throw new Error('Invalid file structure: arrays not found');
        }

        const testId = params.testId === "sample_test" ? "0" : params.testId;
        const currentTest = tests.find(test => test.id === testId);
        if (!currentTest) {
          throw new Error('Test not found');
        }
        setTestDetails(currentTest);

        const filteredStates = test_states.filter(state => state.test_id === testId);
        setTestStates(filteredStates);

        const relatedEvalLogs = eval_logs.filter(log => 
          filteredStates.some(state => state.id.toString() === log.id.toString())
        );
        
        // Sort eval logs by timestamp
        const sortedEvalLogs = relatedEvalLogs.sort((a, b) => {
          if (!a.timestamp || !b.timestamp) return 0;
          return new Date(a.timestamp) - new Date(b.timestamp);
        });
        
        setEvalLogs(sortedEvalLogs);

        const relatedProcessingTests = processing_tests.filter(test => 
          relatedEvalLogs.some(log => log.id === test.related_eval_log_id)
        );
        setProcessingTests(relatedProcessingTests);

      } catch (e) {
        console.error(e);
        setError(e.message || 'Failed to parse stored file');
      }
    } else {
      setError('No file uploaded');
    }
    setIsLoading(false);
  });

  const handleHomeClick = () => history.push('/');

  const calculateTokens = () => {
    return evalLogs().reduce((acc, log) => {
      const studentTokens = log.output_student ? log.output_student.split(' ').length : 0;
      const mentorTokens = log.output_mentor ? log.output_mentor.split(' ').length : 0;
      return acc + studentTokens + mentorTokens;
    }, 0);
  };

  const calculateTokensPerMessage = () => {
    const totalTokens = calculateTokens();
    const totalMessages = evalLogs().length * 2; // Multiply by 2 since each log has student and mentor message
    return totalMessages ? Math.round(totalTokens / totalMessages) : 0;
  };

  const togglePrompt = (logId, role) => {
    setShowPrompt(prev => ({ ...prev, [logId]: { ...prev[logId], [role]: !prev[logId]?.[role] } }));
  };

  const toggleExpandResult = (stateId) => {
    setExpandedResults(prev => ({ ...prev, [stateId]: !prev[stateId] }));
  };

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
        .message-hover:hover {
          opacity: 0.8;
          cursor: pointer;
        }
        .result-row {
          transition: background-color 0.3s;
        }
        .result-row:hover {
          background-color: #1a2234;
        }
        .processing-result {
          max-width: 300px;
          overflow-x: auto;
          white-space: nowrap;
        }
        .processing-result-expanded {
          white-space: normal;
          word-wrap: break-word;
        }
      `}</style>
      <SwitchSelector />
      <div class="min-h-screen bg-[#0a1020] text-white p-8">
        <Show when={error()}>
          <div class="bg-red-500 text-white p-4 rounded-lg mb-4">
            {error()}
          </div>
        </Show>
        <Show when={isLoading()}>
          <div class="flex justify-center items-center h-screen">
            <ImSpinner8 class="animate-spin text-4xl text-blue-500" />
          </div>
        </Show>
        <Show when={!isLoading() && !error()}>
          <Show when={testDetails()}>
            <div class="flex justify-between">
              <div class="w-[60%] pr-4">
                <div class="flex justify-between items-center mb-8">
                  <div class="flex flex-col space-y-4">
                    <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-4 cursor-pointer transition-all duration-300 hover:opacity-80 hover:bg-[#1a2234]" onClick={handleHomeClick}>
                      <p class="text-white">← Back to Home</p>
                    </div>
                    <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-4 cursor-pointer transition-all duration-300 hover:opacity-80 hover:bg-[#1a2234]">
                      <p class="text-white">Student ID: {testDetails()?.student_gpsm}</p>
                    </div>
                  </div>
                </div>
                
                <div class="grid grid-cols-4 gap-4 mb-8">
                  <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-4 cursor-default transition-all duration-300 hover:opacity-80 ">
                    <p class="text-white font-bold">Tokens Used</p>
                    <p class="text-white">{calculateTokens()}</p>
                  </div>
                  <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-4 cursor-default transition-all duration-300 hover:opacity-80 ">
                    <p class="text-white font-bold">Tokens per Message</p>
                    <p class="text-white">{calculateTokensPerMessage()}</p>
                  </div>
                  <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-4 cursor-default transition-all duration-300 hover:opacity-80 ">
                    <p class="text-white font-bold">Messages Sent</p>
                    <p class="text-white">{evalLogs().length * 2}</p>
                  </div>
                  <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-4 cursor-default transition-all duration-300 hover:opacity-80 ">
                    <p class="text-white font-bold">Tries</p>
                    <p class="text-white">{testDetails()?.tries}</p>
                  </div>
                </div>

                <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-6 mb-8">
                  <h2 class="text-2xl font-bold text-white mb-4">Test Results</h2>
                  <div class="overflow-x-auto">
                    <table class="w-full text-white">
                      <thead>
                        <tr>
                          <th class="text-left p-2">Try</th>
                          <th class="text-left p-2">GPS</th>
                          <th class="text-left p-2">Processing Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={testStates()}>
                          {(state) => {
                            const relatedEvalLog = evalLogs().find(log => log.id.toString() === state.id.toString());
                            const relatedProcessingTest = processingTests().find(test => test.related_eval_log_id === relatedEvalLog?.id);
                            return (
                              <tr class="rounded-lg p-2 mb-1 cursor-pointer transition-all duration-300 hover:bg-[#1a2234]">
                                <td class="p-2">{state.tries_run}</td>
                                <td class="p-2">{relatedEvalLog?.next_gps || 'N/A'}</td>
                                <td class="p-2">
                                  <div 
                                    class={`processing-result ${expandedResults()[state.id] ? 'processing-result-expanded' : ''}`}
                                    onClick={() => toggleExpandResult(state.id)}
                                  >
                                    {relatedProcessingTest?.result[0] || 'N/A'}
                                    {expandedResults()[state.id] ? 
                                      <FaSolidChevronUp class="inline-block ml-2" /> : 
                                      <FaSolidChevronDown class="inline-block ml-2" />
                                    }
                                  </div>
                                </td>
                              </tr>
                            );
                          }}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div class="w-[40%] pl-4" style="max-width: 40%;">
                <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-6 flex flex-col">
                  <h2 class="text-2xl font-bold text-white mb-4">Chat History</h2>
                  <div class="overflow-y-auto flex-grow" style="max-height: calc(100vh - 12rem);">
                    <For each={evalLogs()}>
                      {(log, index) => (
                        <>
                          {index() === 0 || (log.timestamp && evalLogs()[index() - 1].timestamp && 
                            !isSameDay(parseISO(log.timestamp), parseISO(evalLogs()[index() - 1].timestamp))) && (
                            <p class="text-xs text-gray-500 text-center my-4 italic">
                              {log.timestamp ? format(parseISO(log.timestamp), 'yyyy-MM-dd') : 'Date not available'}
                            </p>
                          )}
                          <div class="flex flex-col space-y-4 mb-4">
                            <div class="flex items-start">
                              <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-2 flex-shrink-0">S</div>
                              <div class="p-3 rounded-2xl max-w-[80%] bg-blue-100">
                                <p class="text-sm break-words text-gray-800">
                                  {console.log(log)}
                                  {log.output_student || 'No message available'}
                                </p>
                                <p class="text-xs text-gray-500 text-right mt-1">
                                  {log.timestamp ? format(parseISO(log.timestamp), 'HH:mm') : 'Time not available'}
                                </p>
                              </div>
                            </div>
                            <div class="flex items-start justify-end">
                              <div class="p-3 rounded-2xl max-w-[80%] bg-green-100">
                                <p class="text-sm break-words text-gray-800">
                                  {log.output_mentor || 'No message available'}
                                </p>
                                <p class="text-xs text-gray-500 text-right mt-1">
                                  {log.timestamp ? format(parseISO(log.timestamp), 'HH:mm') : 'Time not available'}
                                </p>
                              </div>
                              <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold ml-2 flex-shrink-0">M</div>
                            </div>
                          </div>
                        </>
                      )}
                    </For>
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

export default Test;
