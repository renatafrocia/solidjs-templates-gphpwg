import { createSignal, Show, onMount } from 'solid-js';
import { twJoin } from 'tailwind-merge';
import { ImSpinner8 } from 'solid-icons/im';
import toast, { Toaster } from 'solid-toast';
import '../../output.css';
import history from '../../history';
import documentsStore from "../_store/documentStore.jsx";

function MainUpload() {
  const [file, setFile] = createSignal(null);
  const [error, setError] = createSignal(null);
  const [existingFile, setExistingFile] = createSignal(null);
  const [isUploading, setIsUploading] = createSignal(false);
  const [jsonContent, setJsonContent] = createSignal(null);
  const { documentStore, setDocumentStore } = documentsStore;

  const requiredFields = ['student_gpsms', 'gpsms', 'tests', 'processing_tests', 'test_states', 'metadata'];

  onMount(() => {
    const storedFile = documentStore();
    if (storedFile) {
      const parsedFile = JSON.parse(storedFile);
      setExistingFile(parsedFile.fileName);
      setJsonContent(JSON.stringify(parsedFile, null, 2));
    }
  });

  const validateJsonStructure = (json) => {
    const missingFields = requiredFields.filter(field => !(field in json));
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile?.type === 'application/json') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a valid JSON file.');
      setFile(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file()) {
      setError('No file selected.');
      return;
    }

    setIsUploading(true);
    try {
      const json = await readFileAsJson(file());
      validateJsonStructure(json);
      json.fileName = file().name;
      setDocumentStore(JSON.stringify(json));
      setExistingFile(file().name);
      setJsonContent(JSON.stringify(json, null, 2));
      showToast('success', 'File uploaded successfully!');
    } catch (e) {
      setError(`Failed to parse JSON file: ${e.message}`);
      showToast('error', `Failed to upload file: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const readFileAsJson = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          resolve(JSON.parse(e.target.result));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const handleDelete = () => {
    setDocumentStore('');
    setExistingFile(null);
    setJsonContent(null);
    setFile(null);
    showToast('success', 'File deleted successfully!');
  };

  const handleGoToVisualization = () => {
    history.push('/');
  };

  const showToast = (type, message) => {
    toast[type](message, {
      className: "border-2 border-[#212a3b]",
      style: {
        background: "#030816",
        color: "#ffffff",
      },
    });
  };

  return (
    <>
      <style>
        {`
          ::-webkit-scrollbar {
            width: 5px;
            height: 5px;
          }
          ::-webkit-scrollbar-track {
            background: #030816;
            border-radius: 5px;
          }
          ::-webkit-scrollbar-thumb {
            background: #212a3b;
            border-radius: 5px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}
      </style>
      <div class="fixed top-0 left-0 z-20 p-1 pl-4">
        <nav class="text-sm font-bold text-gray-400">
          <span 
            class="cursor-pointer hover:text-white transition-colors duration-300" 
            onClick={() => history.push('/')}
          >
            test
          </span>
          <span class="mx-2">&gt;</span>
          <span class="text-gray-600">upload</span>
        </nav>
      </div>
      <div class="flex items-start justify-center min-h-screen bg-[#030816] p-8 pt-12">
        <Toaster />
        <div class="flex w-[96vw] pl-3 space-x-2">
          <div class="w-4/6 p-4 space-y-8 bg-[#030816] rounded-lg border border-[#212a3b]">
            <h2 class="text-3xl font-bold mb-8 text-white">Upload Evaluation JSON File</h2>
            <form onSubmit={handleSubmit} class="space-y-6">
              <div>
                <label for="file-upload" class="block text-sm font-medium text-gray-400">
                  Upload a JSON file with required fields: {requiredFields.join(', ')}
                </label>
                <Show when={existingFile()}>
                  <div class="mt-1 flex items-center">
                    <span class="inline-flex items-center my-2 px-3 py-1 rounded-md text-sm font-medium bg-[#212a3b] text-white">
                      {existingFile()}
                      <button
                        type="button"
                        onClick={handleDelete}
                        class="ml-2 text-gray-400 hover:text-white focus:outline-none"
                        title="Delete current file"
                      >
                        x
                      </button>
                    </span>
                  </div>
                </Show>
                <div class="mt-1">
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept="application/json"
                    onChange={handleFileChange}
                    class={twJoin(
                      'block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4',
                      'file:rounded-md file:border-0 file:text-sm file:font-semibold',
                      'file:bg-[#212a3b] file:text-white hover:file:bg-[#2c3a52]',
                      error() ? 'border-red-500' : 'border-[#212a3b]',
                      'rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#212a3b] focus:border-[#212a3b]'
                    )}
                  />
                </div>
                <Show when={error()}>
                  <p class="mt-2 text-sm text-red-500">{error()}</p>
                </Show>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isUploading() || !file()}
                  class={twJoin(
                    'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
                    isUploading() || !file() ? 'bg-[#212a3b] cursor-not-allowed' : 'bg-[#212a3b] hover:bg-[#2c3a52] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#212a3b]'
                  )}
                >
                  {isUploading() ? (
                    <>
                      <ImSpinner8 class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      Uploading...
                    </>
                  ) : (
                    existingFile() ? 'Replace File' : 'Upload File'
                  )}
                </button>
                <Show when={existingFile()}>
                  <button
                    onClick={handleGoToVisualization}
                    class="w-full flex justify-center mt-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#212a3b] hover:bg-[#2c3a52] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#212a3b]"
                  >
                    Go to Evaluation Visualization
                  </button>
                </Show>
              </div>
            </form>
          </div>

          <Show when={jsonContent()}>
            <div class="w-2/6 max-w-md p-8 space-y-4 bg-[#030816] rounded-lg border border-[#212a3b]">
              <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">JSON Content</h2>
                <button
                  onClick={handleDelete}
                  class="text-gray-400 hover:text-white"
                  title="Delete JSON content"
                >
                  x
                </button>
              </div>
              <div class="overflow-auto h-[28rem] bg-[#030816] p-4 rounded-md border border-[#212a3b]">
                <pre class="text-sm text-gray-400 whitespace-pre-wrap break-all" style="max-width: 100%; word-wrap: break-word;">{jsonContent()}</pre>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </>
  );
}

export default MainUpload;
