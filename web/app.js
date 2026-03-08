document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt-input');
    const modelSelect = document.getElementById('model-select');
    const generateBtn = document.getElementById('generate-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const previewFrame = document.getElementById('preview-frame');
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');
    const statusArea = document.getElementById('status-area');

    let isGenerating = false;

    // Fetch available models on page load
    const fetchModels = async () => {
        try {
            const response = await fetch('/api/models');
            if (!response.ok) throw new Error('Failed to fetch models');
            const models = await response.json();
            modelSelect.innerHTML = '';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                if (model.includes('glm-5:cloud')) {
                    option.selected = true;
                }
                modelSelect.appendChild(option);
            });
        } catch (error) {
            console.error(error);
            statusArea.textContent = 'Error: Could not connect to Ollama.';
        }
    };

    // WebSocket connection for real-time progress updates
    const ws = new WebSocket(`ws://${window.location.host}`);
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
            case 'progress':
                loaderText.textContent = message.data;
                break;
            case 'generationComplete':
                previewFrame.src = `${message.data}?t=${new Date().getTime()}`; // Add timestamp to force reload
                setGeneratingState(false);
                regenerateBtn.style.display = 'flex';
                downloadBtn.disabled = false;
                break;
            case 'error':
                statusArea.textContent = `Error: ${message.data}`;
                setGeneratingState(false);
                break;
        }
    };

    const setGeneratingState = (generating) => {
        isGenerating = generating;
        generateBtn.disabled = generating;
        regenerateBtn.disabled = generating;
        promptInput.disabled = generating;
        modelSelect.disabled = generating;
        loader.style.display = generating ? 'flex' : 'none';
        generateBtn.innerHTML = generating ? 'Generating...' : '<svg>...</svg> Generate Website'; // Re-add SVG
    };

    const handleGenerate = async () => {
        const prompt = promptInput.value;
        const model = modelSelect.value;
        if (!prompt || !model || isGenerating) return;

        setGeneratingState(true);
        loaderText.textContent = 'Sending prompt to AI...';
        statusArea.textContent = '';
        previewFrame.src = 'about:blank';

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, model }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API request failed');
            }
        } catch (error) {
            console.error('Generation failed:', error);
            statusArea.textContent = `Error: ${error.message}`;
            setGeneratingState(false);
        }
    };

    generateBtn.addEventListener('click', handleGenerate);
    regenerateBtn.addEventListener('click', handleGenerate);

    downloadBtn.addEventListener('click', () => {
        window.location.href = '/api/download';
    });

    fetchModels();
});
