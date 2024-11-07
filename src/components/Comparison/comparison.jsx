import { createSignal, Show, onMount, createEffect, createMemo, For } from 'solid-js';
import { twJoin } from 'tailwind-merge';
import { ImSpinner8 } from 'solid-icons/im';
import toast, { Toaster } from 'solid-toast';
import '../../output.css';
import history from '../../history';
import documentsStore from "../_store/documentStore.jsx";
import SwitchSelector from "../switchSelector/switchSelector.jsx";

// Utility functions
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

const parseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
};

// Components
const FileUploadInput = (props) => {
  return (
    <div class="flex-1">
      <label for={`file-upload-${props.fileNumber}`} class="block text-sm font-medium text-gray-400">
        Test {props.fileNumber}
      </label>
      <div class="mt-1">
        <input
          id={`file-upload-${props.fileNumber}`}
          name={`file-upload-${props.fileNumber}`}
          type="file"
          accept="application/json"
          onChange={(e) => props.onChange(e, props.fileNumber)}
          class={twJoin(
            'block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4',
            'file:rounded-md file:border-0 file:text-sm file:font-semibold',
            'file:bg-[#212a3b] file:text-white hover:file:bg-[#2c3a52]',
            props.error ? 'border-red-500' : 'border-[#212a3b]',
            'rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#212a3b] focus:border-[#212a3b]'
          )}
        />
      </div>
      <Show when={props.existingFile}>
        <p class="mt-2 text-sm text-gray-400">Current file: {props.existingFile}</p>
      </Show>
    </div>
  );
};

const ComparisonResultsOverview = (props) => {
  return (
    <div class="bg-[#0a1020] p-4 rounded-md">
      <h4 class="text-lg font-semibold text-white mb-2">File Overview</h4>
      <p class="text-gray-400">Total differences: {Object.keys(props.result || {}).length}</p>
      <p class="text-gray-400">File 1 size: {JSON.stringify(props.fileContents?.file1)?.length || 0} bytes</p>
      <p class="text-gray-400">File 2 size: {JSON.stringify(props.fileContents?.file2)?.length || 0} bytes</p>
      <p class="text-gray-400">Similarity score: {props.similarityScore.toFixed(2)}%</p>
      <p class="text-gray-400">Structure similarity: {props.structureSimilarity.toFixed(2)}%</p>
      <p class="text-gray-400">Content similarity: {props.contentSimilarity.toFixed(2)}%</p>
    </div>
  );
};

const DeepAnalysisResults = (props) => {
  return (
    <div class="bg-[#0a1020] p-4 rounded-md">
      <h4 class="text-lg font-semibold text-white mb-2">Deep Analysis Results</h4>
      <p class="text-gray-400">Structure Similarity: {props.structureSimilarity.toFixed(2)}%</p>
      <p class="text-gray-400">Content Similarity: {props.contentSimilarity.toFixed(2)}%</p>
      <div class="mt-4">
        <h5 class="text-md font-semibold text-white mb-2">Processing Tests Differences:</h5>
        <For each={props.processingTestsDiff}>
          {(diff) => (
            <div class="mb-2 p-2 bg-[#1a2030] rounded">
              <p class="text-sm text-gray-400">Test ID: {diff.test_id}</p>
              <For each={Object.entries(diff.differences)}>
                {([key, value]) => (
                  <p class="text-sm text-gray-400">
                    {key}: {JSON.stringify(value)}
                  </p>
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

const FileDetails = (props) => {
  return (
    <div class="bg-[#0a1020] p-4 rounded-md">
      <h4 class="text-lg font-semibold text-white mb-2">File {props.fileNumber} Details</h4>
      <pre class="text-white overflow-x-auto max-h-96 whitespace-pre-wrap break-words">{JSON.stringify(props.fileContent, null, 2)}</pre>
    </div>
  );
};

function MainUpload() {
  const [file1, setFile1] = createSignal(null);
  const [file2, setFile2] = createSignal(null);
  const [error, setError] = createSignal(null);
  const [isUploading, setIsUploading] = createSignal(false);
  const [comparisonResult, setComparisonResult] = createSignal(null);
  const [fileContents, setFileContents] = createSignal({ file1: null, file2: null });
  const [activeTab, setActiveTab] = createSignal('overview');
  const [similarityScore, setSimilarityScore] = createSignal(0);
  const [structureSimilarity, setStructureSimilarity] = createSignal(0);
  const [contentSimilarity, setContentSimilarity] = createSignal(0);
  const [deepAnalysisResult, setDeepAnalysisResult] = createSignal(null);
  const [showComparison, setShowComparison] = createSignal(false);
  const [existingFile1, setExistingFile1] = createSignal(null);
  const [existingFile2, setExistingFile2] = createSignal(null);
  const { documentStore, setDocumentStore } = documentsStore;

  onMount(() => {
    const savedFile1 = documentStore;
    const savedFile2 = localStorage.getItem('uploadedFile2');
    if (savedFile1) {
      const parsedFile1 = savedFile1;
      setFileContents((prev) => ({ ...prev, file1: parsedFile1 }));
      setFile1(new File([JSON.stringify(parsedFile1)], parsedFile1.fileName, { type: "application/json" }));
      setExistingFile1(parsedFile1.fileName);
    }
    if (savedFile2) {
      const parsedFile2 = JSON.parse(savedFile2);
      setFileContents((prev) => ({ ...prev, file2: parsedFile2 }));
      setFile2(new File([JSON.stringify(parsedFile2)], parsedFile2.fileName, { type: "application/json" }));
      setExistingFile2(parsedFile2.fileName);
    }
    if (savedFile1 && savedFile2) {
      setShowComparison(true);
      compareFiles();
      performDeepAnalysis();
    }
  });

  const handleFileChange = async (event, fileNumber) => {
    const input = event.target;
    if (input.files && input.files[0]) {
      const selectedFile = input.files[0];
      if (selectedFile.type === 'application/json') {
        if (fileNumber === 1) {
          setFile1(selectedFile);
          setExistingFile1(selectedFile.name);
        } else {
          setFile2(selectedFile);
          setExistingFile2(selectedFile.name);
        }
        setError(null);
        await readFileContent(selectedFile, fileNumber);
      } else {
        setError('Please upload valid JSON files.');
        if (fileNumber === 1) {
          setFile1(null);
          setExistingFile1(null);
        } else {
          setFile2(null);
          setExistingFile2(null);
        }
      }
    }
  };

  const readFileContent = async (file, fileNumber) => {
    try {
      const content = await readFileAsText(file);
      const parsedContent = parseJSON(content);
      setFileContents((prev) => ({ ...prev, [`file${fileNumber}`]: parsedContent }));
      if (fileNumber === 1) {
        setDocumentStore({...parsedContent, fileName: file.name});
      } else {
        localStorage.setItem('uploadedFile2', JSON.stringify({...parsedContent, fileName: file.name}));
      }
    } catch (error) {
      setError(`Failed to read or parse file ${fileNumber}: ${error.message}`);
    }
  };

  const compareFiles = () => {
    const { file1, file2 } = fileContents();
    if (!file1 || !file2) return;

    const differences = {};
    const keys = new Set([...Object.keys(file1), ...Object.keys(file2)]);

    let totalKeys = 0;
    let matchingKeys = 0;

    keys.forEach(key => {
      totalKeys++;
      if (!Object.is(file1[key], file2[key])) {
        differences[key] = {
          file1: file1[key],
          file2: file2[key]
        };
      } else {
        matchingKeys++;
      }
    });

    setComparisonResult(differences);
    setSimilarityScore((matchingKeys / totalKeys) * 100);
  };

  const deepCompare = (obj1, obj2) => {
    if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return Object.is(obj1, obj2);
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key) || !deepCompare(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  };

  const calculateStructureSimilarity = (obj1, obj2) => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    let matchingKeys = 0;
    allKeys.forEach(key => {
      if (keys1.includes(key) && keys2.includes(key)) {
        matchingKeys++;
      }
    });

    return (matchingKeys / allKeys.size) * 100;
  };

  const calculateContentSimilarity = (obj1, obj2) => {
    const keys = Object.keys(obj1);
    let matchingValues = 0;

    keys.forEach(key => {
      if (deepCompare(obj1[key], obj2[key])) {
        matchingValues++;
      }
    });

    return (matchingValues / keys.length) * 100;
  };

  const compareProcessingTests = (tests1, tests2) => {
    const differences = [];
    try {
      const maxLength = Math.max(tests1.length, tests2.length);

    for (let i = 0; i < maxLength; i++) {
      const test1 = tests1[i] || {};
      const test2 = tests2[i] || {};
      const testDiff = {};

      for (const key of ['test_id', 'description', 'mentor_gpsm', 'student_gpsm', 'objective']) {
        if (test1[key] !== test2[key]) {
            testDiff[key] = { file1: test1[key], file2: test2[key] };
          }
        }

        if (Object.keys(testDiff).length > 0) {
          differences.push({ test_id: test1.test_id || test2.test_id, differences: testDiff });
        }
      }

      return differences;
    } catch (error) {
      return [];
    }
  };

  const performDeepAnalysis = () => {
    const { file1, file2 } = fileContents();
    if (!file1 || !file2) return;

    const structureSim = calculateStructureSimilarity(file1, file2);
    const contentSim = calculateContentSimilarity(file1, file2);

    setStructureSimilarity(structureSim);
    setContentSimilarity(contentSim);

    const processingTestsDiff = compareProcessingTests(file1.processing_tests, file2.processing_tests);

    const deepAnalysis = {
      structureSimilarity: structureSim,
      contentSimilarity: contentSim,
      processingTestsDiff: processingTestsDiff,
    };

    setDeepAnalysisResult(deepAnalysis);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (file1() && file2()) {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        compareFiles();
        performDeepAnalysis();
        setShowComparison(true);
        toast.success('Files processed and compared successfully!', {
          className: "border-2 border-[#212a3b]",
          style: {
            background: "#030816",
            color: "#ffffff",
          },
        });
      }, 2000);
    } else {
      setError('Please upload both files.');
    }
  };

  const fileSizeInfo = createMemo(() => {
    try {
      const { file1, file2 } = fileContents();
      if (!file1 || !file2) return null;

      const size1 = JSON.stringify(file1).length;
      const size2 = JSON.stringify(file2).length;
      const difference = Math.abs(size1 - size2);
      const percentageDiff = ((difference / Math.max(size1, size2)) * 100).toFixed(2);

      return {
        size1,
        size2,
        difference,
        percentageDiff
      };
    } catch (error) {
      return null;
    }
  });

  const handleGoToVisualization = () => {
    history.push('/');
  };

  return (
    <div class="flex flex-col items-center justify-center min-h-screen bg-[#030816] p-8">
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
    `}</style>
      <Show when={documentStore !== ''}>
        <SwitchSelector />
      </Show>
      <Toaster />
      <div class="w-full max-w-6xl flex justify-between">
        <div class="w-2/5 p-8 space-y-8 bg-[#030816] rounded-lg border border-[#212a3b]">
          <h2 class="text-3xl font-bold text-center text-white">Upload 2 tests</h2>
          <p class="text-center text-gray-400">Upload 2 tests to compare them</p>
          <form onSubmit={handleSubmit} class="space-y-6">
            <FileUploadInput fileNumber={1} onChange={handleFileChange} error={error()} existingFile={existingFile1()} />
            <FileUploadInput fileNumber={2} onChange={handleFileChange} error={error()} existingFile={existingFile2()} />

            <Show when={error()}>
              <p class="mt-2 text-sm text-red-500">{error()}</p>
            </Show>

            <div>
              <button
                type="submit"
                disabled={isUploading() || !file1() || !file2()}
                class={twJoin(
                  'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
                  isUploading() || !file1() || !file2() ? 'bg-[#212a3b] cursor-not-allowed' : 'bg-[#212a3b] hover:bg-[#2c3a52] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#212a3b]'
                )}
              >
                {isUploading() ? (
                  <>
                    <ImSpinner8 class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Processing...
                  </>
                ) : (
                  'Compare'
                )}
              </button>
            </div>
          </form>
          <Show when={file1() && file2()}>
            <button
              onClick={handleGoToVisualization}
              class="w-full flex justify-center mt-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#212a3b] hover:bg-[#2c3a52] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#212a3b]"
            >
              Go to Evaluation Visualization
            </button>
          </Show>
        </div>

        <Show when={showComparison()}>
          <div class="w-3/5 p-8 space-y-4 bg-[#030816] rounded-lg border border-[#212a3b]">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-white">Comparison Results</h2>
            </div>
            <div class="flex mb-4">
              <button
                class={`mr-2 px-4 py-2 rounded-md ${activeTab() === 'overview' ? 'bg-[#212a3b] text-white' : 'bg-[#0a1020] text-gray-400'}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                class={`mr-2 px-4 py-2 rounded-md ${activeTab() === 'deep' ? 'bg-[#212a3b] text-white' : 'bg-[#0a1020] text-gray-400'}`}
                onClick={() => setActiveTab('deep')}
              >
                Deep Analysis
              </button>
              <button
                class={`mr-2 px-4 py-2 rounded-md ${activeTab() === 'file1' ? 'bg-[#212a3b] text-white' : 'bg-[#0a1020] text-gray-400'}`}
                onClick={() => setActiveTab('file1')}
              >
                File 1
              </button>
              <button
                class={`px-4 py-2 rounded-md ${activeTab() === 'file2' ? 'bg-[#212a3b] text-white' : 'bg-[#0a1020] text-gray-400'}`}
                onClick={() => setActiveTab('file2')}
              >
                File 2
              </button>
            </div>
            <div class="overflow-auto h-[28rem] bg-[#030816] p-4 rounded-md border border-[#212a3b]">
              <Show when={activeTab() === 'overview'}>
                <ComparisonResultsOverview 
                  result={comparisonResult()} 
                  fileContents={fileContents()} 
                  similarityScore={similarityScore()}
                  structureSimilarity={structureSimilarity()}
                  contentSimilarity={contentSimilarity()}
                />
                <Show when={fileSizeInfo()}>
                  <div class="mt-4 bg-[#0a1020] p-4 rounded-md">
                    <h4 class="text-lg font-semibold text-white mb-2">File Size Comparison</h4>
                    <p class="text-gray-400">Size difference: {fileSizeInfo().difference} bytes</p>
                    <p class="text-gray-400">Percentage difference: {fileSizeInfo().percentageDiff}%</p>
                  </div>
                </Show>
              </Show>
              <Show when={activeTab() === 'deep'}>
                <DeepAnalysisResults 
                  structureSimilarity={structureSimilarity()}
                  contentSimilarity={contentSimilarity()}
                  processingTestsDiff={deepAnalysisResult()?.processingTestsDiff || []}
                />
              </Show>
              <Show when={activeTab() === 'file1'}>
                <FileDetails fileNumber={1} fileContent={fileContents().file1} />
              </Show>
              <Show when={activeTab() === 'file2'}>
                <FileDetails fileNumber={2} fileContent={fileContents().file2} />
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

export default MainUpload;
