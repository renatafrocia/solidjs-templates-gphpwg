import { createSignal, Show, onMount, For } from 'solid-js';
import { twJoin } from 'tailwind-merge';
import { ImSpinner8 } from 'solid-icons/im';
import toast, { Toaster } from 'solid-toast';
import '../../output.css';
import { useNavigate } from '@solidjs/router';
import history from '../../history';
import { Chart, registerables } from 'chart.js';
import { Line, Bar, Doughnut } from 'solid-chartjs';
import documentsStore from "../_store/documentStore.jsx";
import SwitchSelector from "../switchSelector/switchSelector.jsx";

Chart.register(...registerables);

function Home() {
  const [metadata, setMetadata] = createSignal(null);
  const [tokenStats, setTokenStats] = createSignal(null);
  const [tests, setTests] = createSignal([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [view, setView] = createSignal('overview');
  const [chartData, setChartData] = createSignal({
    line: null,
    bar: null,
    doughnut: null
  });
  const navigate = useNavigate();
  const { documentStore, setDocumentStore } = documentsStore;

  onMount(async () => {
    // Add small delay to ensure store is properly initialized
    await new Promise(resolve => setTimeout(resolve, 100));
    loadDataFromStore();
  });

  const loadDataFromStore = () => {
    const storedFile = documentStore();
    if (!storedFile) {
      setError('No file uploaded');
      setIsLoading(false);
      return;
    }

    try {
      const parsedFile = JSON.parse(storedFile);
      if (!parsedFile) {
        throw new Error('Failed to parse file');
      }
      processFileData(parsedFile);
    } catch (e) {
      console.error('Error loading data:', e);
      setError('Failed to parse stored file');
    } finally {
      setIsLoading(false);
    }
  };

  const processFileData = (parsedFile) => {
    if (!parsedFile.metadata || !parsedFile.eval_logs) {
      setError('Invalid file structure: metadata or eval_logs not found');
      return;
    }

    setMetadata(parsedFile.metadata);
    calculateTokenStats(parsedFile.eval_logs);
    
    if (!parsedFile.tests || !Array.isArray(parsedFile.tests)) {
      setError('Invalid file structure: tests array not found');
      return;
    }

    setTests(parsedFile.tests);
    prepareChartData(parsedFile.eval_logs, parsedFile.tests);
  };

  const calculateTokenStats = (evalLogs) => {
    const totalTokens = evalLogs.reduce((acc, log) => {
      const outputTokens = log.output_response.split(' ').length;
      const inputTokens = log.input_query.split(' ').length;
      return {
        output: acc.output + outputTokens,
        input: acc.input + inputTokens
      };
    }, { output: 0, input: 0 });

    const avgTokens = {
      output: totalTokens.output / evalLogs.length,
      input: totalTokens.input / evalLogs.length
    };

    setTokenStats({
      totalOutputTokens: totalTokens.output,
      avgOutputTokens: avgTokens.output,
      totalInputTokens: totalTokens.input,
      avgInputTokens: avgTokens.input
    });
  };

  const prepareChartData = (evalLogs, testsData) => {
    prepareLineChartData(evalLogs);
    prepareBarChartData(evalLogs);
    prepareDoughnutChartData(testsData);
  };

  const prepareLineChartData = (evalLogs) => {
    const outputTokens = evalLogs.map(log => log.output_response.split(' ').length);
    const labels = evalLogs.map((_, index) => `Log ${index + 1}`);

    const lineChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Output Tokens',
          data: outputTokens,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };

    setChartData(prev => ({ ...prev, line: lineChartData }));
  };

  const prepareBarChartData = (evalLogs) => {
    const inputTokens = evalLogs.map(log => log.input_query.split(' ').length);
    const labels = evalLogs.map((_, index) => `Log ${index + 1}`);

    const barChartData = {
      labels: labels,
      datasets: [{
        label: 'Input Tokens',
        data: inputTokens,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };

    setChartData(prev => ({ ...prev, bar: barChartData }));
  };

  const prepareDoughnutChartData = (testsData) => {
    const testResults = testsData.reduce((acc, test) => {
      acc[test.result] = (acc[test.result] || 0) + 1;
      return acc;
    }, {});

    const doughnutChartData = {
      labels: Object.keys(testResults),
      datasets: [{
        label: 'Test Results',
        data: Object.values(testResults),
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)'
        ],
        hoverOffset: 4
      }]
    };

    setChartData(prev => ({ ...prev, doughnut: doughnutChartData }));
  };

  const handleTestClick = (testId) => {
    history.push(`/test/${testId}`);
  };

  const handleUpload = () => {
    history.push('/upload');
  };

  const renderStatsCard = (title, value) => (
    <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-4 flex-1">
      <h2 class="text-lg font-semibold mb-2 text-white">{title}</h2>
      <p class="text-2xl font-bold text-white">{value || 'N/A'}</p>
    </div>
  );

  const renderChartCard = (title, chartComponent) => (
    <div class="bg-[#0a1020] rounded-lg border border-[#212a3b] p-6">
      <h2 class="text-xl font-semibold mb-2 text-white">{title}</h2>
      {chartComponent}
    </div>
  );

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
        </nav>
      </div>
      <div class="flex flex-col items-center justify-center min-h-screen bg-[#030816] p-8 pt-12">
        <Toaster />
        <div class="mb-8">
          <button 
            class={`px-4 py-2 rounded-l-lg border border-[#212a3b] text-white ${view() === 'overview' ? 'bg-[#212a3b]' : 'bg-[#030816]'}`}
            onClick={() => setView('overview')}
          >
            Overview
          </button>
          <button 
            class={`px-4 py-2 rounded-r-lg border border-[#212a3b] text-white ${view() === 'drill-down' ? 'bg-[#212a3b]' : 'bg-[#030816]'}`}
            onClick={() => history.push('/sessions')}
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
            <div class="flex flex-wrap justify-center gap-4 mb-8 w-full">
              {renderStatsCard("Total Tests", metadata()?.total_tests)}
              {renderStatsCard("Total Output Tokens", tokenStats()?.totalOutputTokens)}
              {renderStatsCard("Avg Output Tokens", tokenStats()?.avgOutputTokens?.toFixed(2))}
              {renderStatsCard("Total Input Tokens", tokenStats()?.totalInputTokens)}
              {renderStatsCard("Avg Input Tokens", tokenStats()?.avgInputTokens?.toFixed(2))}
            </div>
            <div class="grid grid-cols-3 gap-4">
              {renderChartCard("Output Tokens Over Time", 
                <Show when={chartData().line}>
                  <Line data={chartData().line} />
                </Show>
              )}
              {renderChartCard("Input Token Distribution", 
                <Show when={chartData().bar}>
                  <Bar data={chartData().bar} />
                </Show>
              )}
              {renderChartCard("Test Results",  
                <Show when={chartData().doughnut}>
                  <Doughnut data={chartData().doughnut} />
                </Show>
              )}
            </div>
          </Show>
        </Show>
      </div>
    </>
  );
}

export default Home;
