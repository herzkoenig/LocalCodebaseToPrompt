class GitIgnore {
    constructor(patterns) {
        this.patterns = [];
        
        // Split into lines and process each pattern
        patterns.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .forEach(pattern => {
                // Handle negation patterns (patterns starting with !)
                const isNegation = pattern.startsWith('!');
                pattern = isNegation ? pattern.slice(1) : pattern;
    
                // Remove trailing slashes
                pattern = pattern.replace(/\/+$/, '');
    
                // Handle leading slashes
                const isAbsolute = pattern.startsWith('/');
                pattern = pattern.replace(/^\/+/, '');
    
                // Convert glob patterns to RegExp
                let regexPattern = pattern
                    .replace(/\./g, '\\.')
                    .replace(/\*\*/g, '{{GLOBSTAR}}') // Temporarily replace ** 
                    .replace(/\*/g, '[^/]*')  // Single * matches anything except /
                    .replace(/\?/g, '[^/]')   // ? matches single character except /
                    .replace(/{{GLOBSTAR}}/g, '.*') // ** matches anything including /
                    .replace(/\/$/, ''); // Remove trailing slash again just in case
    
                // Create the complete regex pattern
                let fullPattern = isAbsolute ? 
                    `^${regexPattern}(?:$|/)` : 
                    `(?:^|/)${regexPattern}(?:$|/)`;
    
                this.patterns.push({
                    regex: new RegExp(fullPattern),
                    isNegation,
                    original: pattern
                });
            });
    
        // Add default patterns
        const defaultPatterns = [
            '^.git(?:$|/)',
            '^.husky(?:$|/)',
            '^.vscode(?:$|/)',
            '^node_modules(?:$|/)',
            '^\\.next(?:$|/)',
            '^out(?:$|/)',
            '^build(?:$|/)',
            '^coverage(?:$|/)',
            '\\.DS_Store$',
            '\\.env\\.*',
            '\\.pnp\\.*',
            '\\.yarn/*',
            '\\.vercel(?:$|/)',
            '\\.tsbuildinfo$',
            '^next-env\\.d\\.ts$'
        ];
    
        defaultPatterns.forEach(pattern => {
            this.patterns.push({
                regex: new RegExp(pattern),
                isNegation: false,
                original: pattern
            });
        });
    }
    
    ignores(path) {
        // Normalize path
        path = path.replace(/^\/+/, '').replace(/\/+$/, '');
        
        let ignored = false;
        
        // Check all patterns in order
        for (const pattern of this.patterns) {
            if (pattern.regex.test(path)) {
                ignored = !pattern.isNegation;
            }
        }
        
        return ignored;
    }
    
    // Helper method to debug patterns
    debugPattern(path) {
        const matches = [];
        for (const pattern of this.patterns) {
            if (pattern.regex.test(path)) {
                matches.push({
                    pattern: pattern.original,
                    isNegation: pattern.isNegation,
                    regex: pattern.regex.toString()
                });
            }
        }
        return matches;
    }
}

const folderBtn = document.getElementById('folderBtn');
const selectedPath = document.getElementById('selectedPath');
const gitignoreStatus = document.getElementById('gitignoreStatus');
const fileTree = document.getElementById('fileTree');
const selectAllBtn = document.getElementById('selectAllBtn');
const combineBtn = document.getElementById('combineBtn');
const output = document.getElementById('output');
const combinedOutput = document.getElementById('combinedOutput');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const loadingText = document.getElementById('loadingText');
const presetName = document.getElementById('presetName');
const savePresetBtn = document.getElementById('savePresetBtn');
const loadPresetBtn = document.getElementById('loadPresetBtn');
const deletePresetBtn = document.getElementById('deletePresetBtn');
const presetSelect = document.getElementById('presetSelect');
const missingFilesAlert = document.getElementById('missingFilesAlert');
const exportPresetsBtn = document.getElementById('exportPresetsBtn');
const importPresetsInput = document.getElementById('importPresetsInput');

const includePreamble = document.getElementById('includePreamble');
const preambleOptions = document.getElementById('preambleOptions');
const preambleSelect = document.getElementById('preambleSelect');
const customPreamble = document.getElementById('customPreamble');

const includeGoal = document.getElementById('includeGoal');
const goalOptions = document.getElementById('goalOptions');
const goalText = document.getElementById('goalText');

const filterInput = document.getElementById('filterInput');
const clearFilterBtn = document.getElementById('clearFilterBtn');

const totalSizeDisplay = document.getElementById('totalSizeDisplay');
const totalLinesDisplay = document.getElementById('totalLinesDisplay');
const tallyWarning = document.getElementById('tallyWarning');

const clearFilterSelectionsBtn = document.getElementById('clearFilterSelectionsBtn');
const fileTypeFilterButtons = document.querySelectorAll('button[data-filter-type]');

const minifyOutput = document.getElementById('minifyOutput');
const minifyStats = document.getElementById('minifyStats');

const removeComments = document.getElementById('removeComments');
const commentStats = document.getElementById('commentStats');

const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkModeEnabled', isDark ? 'true' : 'false');
    darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

let fileHandles = [];
let folderHandle = null;
let ignoreFilter = null;
let pathToElement = {};
let filterSelectedPaths = new Set();
let userAddedTextExtensions = []; // For storing custom extensions

// Function to load custom extensions from localStorage
function loadCustomExtensions() {
    const storedExtensions = localStorage.getItem('userAddedTextExtensions');
    if (storedExtensions) {
        userAddedTextExtensions = JSON.parse(storedExtensions);
    }
}

// Function to save custom extensions to localStorage
function saveCustomExtensions() {
    localStorage.setItem('userAddedTextExtensions', JSON.stringify(userAddedTextExtensions));
}

// Load custom extensions when the script starts
loadCustomExtensions();

function showGlobalMessage(message, type = 'error') {
    const messageDiv = document.getElementById('globalMessage');
    messageDiv.textContent = message;
    messageDiv.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
    messageDiv.classList.add('rounded-lg', 'p-4', 'text-sm', 'shadow-lg');
    if (type === 'error') {
        messageDiv.classList.add('bg-red-100', 'text-red-700');
    } else {
        messageDiv.classList.add('bg-green-100', 'text-green-700');
    }
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

includePreamble.addEventListener('change', () => {
    preambleOptions.classList.toggle('hidden', !includePreamble.checked);
});
preambleSelect.addEventListener('change', () => {
    customPreamble.value = preambleSelect.value === 'custom' ? '' : preambleSelect.value;
});

includeGoal.addEventListener('change', () => {
    goalOptions.classList.toggle('hidden', !includeGoal.checked);
});

function setLoading(isLoading, message = 'Processing folder contents...') {
    loadingIndicator.classList.toggle('hidden', !isLoading);
    loadingText.textContent = message;
    folderBtn.disabled = isLoading;
    refreshBtn.disabled = isLoading;
    selectAllBtn.disabled = isLoading;
    combineBtn.disabled = isLoading;
    savePresetBtn.disabled = isLoading;
    loadPresetBtn.disabled = isLoading;
    deletePresetBtn.disabled = isLoading;
    exportPresetsBtn.disabled = isLoading;
    importPresetsInput.disabled = isLoading;
    includePreamble.disabled = isLoading;
    preambleSelect.disabled = isLoading;
    customPreamble.disabled = isLoading ? true : false;
    includeGoal.disabled = isLoading;
    goalText.disabled = isLoading ? true : false;
    filterInput.disabled = isLoading;
    clearFilterBtn.disabled = isLoading;
    clearFilterSelectionsBtn.disabled = isLoading;
    fileTypeFilterButtons.forEach(btn => btn.disabled = isLoading);
    minifyOutput.disabled = isLoading;
    removeComments.disabled = isLoading;

    const customExtInput = document.getElementById('customTextExtensionsInput');
    const customExtBtn = document.getElementById('addCustomTextExtensionsBtn');
    if (customExtInput) customExtInput.disabled = isLoading;
    if (customExtBtn) customExtBtn.disabled = isLoading;
}

function isTextFile(name) {
    const initialTextExtensions = [
        '.txt', '.md', '.csv', '.js', '.css', '.html', 
        '.json', '.xml', '.yaml', '.yml', '.ini', '.log',
        '.sh', '.bash', '.py', '.java', '.cpp', '.c', '.h',
        '.config', '.env', '.gitignore', '.sql', '.ts',
        '.tsx', '.schema', '.mjs', '.cjs', '.jsx', '.rs',
        '.go', '.php', '.rb', '.toml', '.prisma', '.bat', '.ps1',
        '.svelte', '.lock'
    ];
    const allTextExtensions = initialTextExtensions.concat(userAddedTextExtensions);

     // Check for exact matches for files without extensions
    const exactMatches = ['Makefile', 'Dockerfile'];

    // First check exact matches
    if (exactMatches.includes(name)) {
        return true;
    }
    // Then check extensions (both initial and user-added)
    return allTextExtensions.some(ext => name.toLowerCase().endsWith(ext));
}

async function tryReadGitignore(dirHandle) {
    try {
        const gitignoreHandle = await dirHandle.getFileHandle('.gitignore');
        const file = await gitignoreHandle.getFile();
        const content = await file.text();
        if (content.trim() === '') {
            gitignoreStatus.textContent = '.gitignore found but empty';
            ignoreFilter = new GitIgnore('.git/');
            return true;
        }
        ignoreFilter = new GitIgnore(content + '\n.git/');
        gitignoreStatus.textContent = '.gitignore found and applied';
        return true;
    } catch {
        ignoreFilter = new GitIgnore('.git/');
        gitignoreStatus.textContent = 'Using default ignore patterns';
        return true;
    }
}

async function getFileSizeAndLines(fileHandle) {
    const file = await fileHandle.getFile();
    const size = file.size;
    let lines = 0;
    if (isTextFile(fileHandle.name)) {
        const content = await file.text();
        lines = content.split('\n').length;
    }
    return { size, lines };
}

async function buildFileTree(handle, path = '', container = fileTree, depth = 0) {
    let aggregatedTextFileCount = 0;
    let aggregatedTotalLineCount = 0;

    const entries = [];
    // Show initial loading message before starting to iterate
    if (depth === 0) { // Only for the root call, or adjust as needed
        loadingText.textContent = 'Processing folder contents... (0 items found)';
    }
    let itemsProcessedInThisCall = 0;

    for await (const entry of handle.values()) {
        entries.push(entry);
        itemsProcessedInThisCall++;
        if (itemsProcessedInThisCall % 100 === 0) {
            // This message might become complex if many recursive calls update it.
            // Consider a global counter if this becomes an issue.
            loadingText.textContent = `Processing folder contents... (${itemsProcessedInThisCall} items scanned in current directory level)`;
        }
    }
    entries.sort((a, b) => {
        if (a.kind === b.kind) return a.name.localeCompare(b.name);
        return a.kind === 'directory' ? -1 : 1;
    });

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const entryPath = path ? `${path}/${entry.name}` : entry.name;
        if (ignoreFilter && ignoreFilter.ignores(entryPath)) {
            continue;
        }

        const isLast = i === entries.length - 1;
        const div = document.createElement('div');
        div.className = `tree-line ${isLast ? 'tree-last' : ''}`;
        if (depth > 0) {
            div.classList.add('tree-indent');
        }

        pathToElement[entryPath] = div;

        if (entry.kind === 'directory') {
            const folderDiv = document.createElement('div');
            folderDiv.className = 'font-bold mb-1 folder-name flex items-center gap-2';
            const folderCheckbox = document.createElement('input');
            folderCheckbox.type = 'checkbox';
            folderCheckbox.className = 'mr-2';
            folderCheckbox.dataset.path = entryPath;
            folderCheckbox.dataset.type = 'directory';
            folderCheckbox.setAttribute('data-tippy-content', 'Check/uncheck this folder to select/deselect all its text files.');
            folderDiv.appendChild(folderCheckbox);
            
            const folderLabel = document.createElement('span');
            // Initial text, will be appended with stats later
            folderLabel.textContent = `📁 ${entry.name}`;
            folderLabel.setAttribute('data-tippy-content', 'Folder in your project. Check its box to select all files inside.');
            folderDiv.appendChild(folderLabel);
            div.appendChild(folderDiv);

            const subContainer = document.createElement('div');
            div.appendChild(subContainer);
            const subHandle = await handle.getDirectoryHandle(entry.name);
            
            // Recursive call to process the subdirectory
            const subDirStats = await buildFileTree(subHandle, entryPath, subContainer, depth + 1);
            
            // Update this folder's label with the stats from the subdirectory
            if (subDirStats.textFileCount > 0) { // Only show if there are text files within
                folderLabel.textContent += ` (Files: ${subDirStats.textFileCount}, Lines: ${subDirStats.totalLineCount.toLocaleString()})`;
            }

            // Aggregate stats from the subdirectory to the current directory's totals
            aggregatedTextFileCount += subDirStats.textFileCount;
            aggregatedTotalLineCount += subDirStats.totalLineCount;
        } else {
            const fileHandle = await handle.getFileHandle(entry.name);
            const { size, lines } = await getFileSizeAndLines(fileHandle);
            const isText = isTextFile(entry.name);
            
            if (isText) {
                fileHandles.push({ handle: fileHandle, path: entryPath, size, lines });
                // This file is a direct child, so add to aggregated counts
                aggregatedTextFileCount++;
                aggregatedTotalLineCount += lines;
            }

            const fileDiv = document.createElement('div');
            fileDiv.className = 'flex items-center mb-1';
            if (isText) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'mr-2';
                checkbox.dataset.path = entryPath;
                checkbox.dataset.type = 'file';
                checkbox.setAttribute('data-tippy-content', 'Check this file to include it in the combined output.');
                fileDiv.appendChild(checkbox);
            }
            const label = document.createElement('span');
            label.className = isText ? 'text-gray-800' : 'text-gray-400';
            if (isText) {
                label.textContent = `📄 ${entry.name} (${(size / 1024).toFixed(2)} KB | ${lines.toLocaleString()} lines)`;
                label.setAttribute('data-tippy-content', 'A selectable text file. Check to include in the combined output.');
            } else {
                label.textContent = `📄 ${entry.name} (non-text file)`;
                label.setAttribute('data-tippy-content', 'Non-text file; cannot be included in the combined output.');
            }
            fileDiv.appendChild(label);
            div.appendChild(fileDiv);
        }
        container.appendChild(div);
    }
    return { textFileCount: aggregatedTextFileCount, totalLineCount: aggregatedTotalLineCount };
}

function showPresetMessage(message, type = 'error') {
    const messageDiv = document.getElementById('presetMessage');
    messageDiv.textContent = message;
    messageDiv.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
    messageDiv.classList.add('error-message');
    if (type === 'error') {
        messageDiv.classList.add('bg-red-100', 'text-red-700');
    } else {
        messageDiv.classList.add('bg-green-100', 'text-green-700');
    }
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

function loadPresetsFromStorage() {
    presetSelect.innerHTML = '<option value="">Select a preset</option>';
    const presets = JSON.parse(localStorage.getItem('presets') || '{}');
    Object.keys(presets).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = key;
        presetSelect.appendChild(opt);
    });
}

function savePreset() {
    const name = presetName.value.trim();
    if (!name) {
        showPresetMessage('Please enter a preset name.');
        return;
    }
    const selectedPaths = Array.from(fileTree.querySelectorAll('input[type="checkbox"]:checked[data-type="file"]'))
        .map(cb => cb.dataset.path);
    const settings = {
        files: selectedPaths,
        preamble: {
            enabled: includePreamble.checked,
            mode: preambleSelect.value,
            text: customPreamble.value
        },
        goal: {
            enabled: includeGoal.checked,
            text: goalText.value
        }
    };
    const presets = JSON.parse(localStorage.getItem('presets') || '{}');
    presets[name] = settings;
    localStorage.setItem('presets', JSON.stringify(presets));
    loadPresetsFromStorage();
    showPresetMessage('Preset saved successfully!', 'success');
    presetName.value = '';
}

function loadPreset() {
    if (!folderHandle) {
        showPresetMessage('Please select a folder before loading a preset.', 'error');
        return;
    }
    const selectedPreset = presetSelect.value;
    if (!selectedPreset) {
        showPresetMessage('Please select a preset to load.');
        return;
    }
    const presets = JSON.parse(localStorage.getItem('presets') || '{}');
    const preset = presets[selectedPreset];
    if (!preset) {
        showPresetMessage('Preset not found.');
        return;
    }
    const checkboxes = fileTree.querySelectorAll('input[type="checkbox"][data-type="file"]');
    checkboxes.forEach(cb => cb.checked = false);
    let missing = [];
    preset.files.forEach(p => {
        const cb = Array.from(checkboxes).find(c => c.dataset.path === p);
        if (cb) {
            cb.checked = true;
        } else {
            missing.push(p);
        }
    });
    if (preset.preamble) {
        includePreamble.checked = preset.preamble.enabled;
        preambleOptions.classList.toggle('hidden', !preset.preamble.enabled);
        preambleSelect.value = preset.preamble.mode;
        customPreamble.value = preset.preamble.text || '';
    }
    if (preset.goal) {
        includeGoal.checked = preset.goal.enabled;
        goalOptions.classList.toggle('hidden', !preset.goal.enabled);
        goalText.value = preset.goal.text || '';
    }
    if (missing.length > 0) {
        showPresetMessage(`Some files in this preset no longer exist: ${missing.join(', ')}`, 'error');
    } else {
        showPresetMessage('Preset loaded successfully!', 'success');
    }
    updateFolderCheckboxes();
    updateTally();
}

function deletePreset() {
    const selectedPreset = presetSelect.value;
    if (!selectedPreset) {
        showPresetMessage('Please select a preset to delete.');
        return;
    }
    const presets = JSON.parse(localStorage.getItem('presets') || '{}');
    if (!presets[selectedPreset]) {
        showPresetMessage('Preset not found.');
        return;
    }
    delete presets[selectedPreset];
    localStorage.setItem('presets', JSON.stringify(presets));
    loadPresetsFromStorage();
    showPresetMessage('Preset deleted successfully!', 'success');
}

async function exportPresetsToFile() {
    const presets = localStorage.getItem('presets') || '{}';
    const blob = new Blob([presets], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presets.json';
    a.click();
    URL.revokeObjectURL(url);
}

importPresetsInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
        const data = JSON.parse(text);
        localStorage.setItem('presets', JSON.stringify(data));
        loadPresetsFromStorage();
        showGlobalMessage('Presets loaded successfully!', 'success');
    } catch {
        showGlobalMessage('Invalid JSON file. Please ensure the file contains valid preset data.', 'error');
    }
    importPresetsInput.value = '';
});

exportPresetsBtn.addEventListener('click', exportPresetsToFile);

folderBtn.addEventListener('click', async () => {
    try {
        folderHandle = await window.showDirectoryPicker();
        selectedPath.textContent = `Selected folder: ${folderHandle.name}`;
        fileTree.innerHTML = '';
        fileHandles = [];
        pathToElement = {};
        setLoading(true);
        await tryReadGitignore(folderHandle);
        await buildFileTree(folderHandle);
        setLoading(false);
        loadPresetsFromStorage();
        applyTooltips();
        refreshBtn.classList.remove('hidden');
        const warningDiv = document.getElementById('folderWarning');
        if (warningDiv) warningDiv.classList.add('hidden');
    } catch (err) {
        console.error('Error selecting folder:', err);
        selectedPath.textContent = 'Error selecting folder. Please try again.';
        setLoading(false);
        const warningDiv = document.getElementById('folderWarning');
        if (warningDiv) warningDiv.classList.remove('hidden');
    }
});

selectAllBtn.addEventListener('click', () => {
    const checkboxes = Array.from(fileTree.querySelectorAll('input[type="checkbox"][data-type="file"]'));
    const visibleCheckboxes = checkboxes.filter(cb => cb.closest('.tree-line').style.display !== 'none');
    const allChecked = visibleCheckboxes.every(cb => cb.checked);
    visibleCheckboxes.forEach(cb => cb.checked = !allChecked);
    updateFolderCheckboxes();
    updateTally();
});

function updateFolderCheckboxes() {
    const folderCheckboxes = fileTree.querySelectorAll('input[type="checkbox"][data-type="directory"]');
    folderCheckboxes.forEach(folderCb => {
        const folderPath = folderCb.dataset.path;
        const childFiles = fileTree.querySelectorAll(`input[type="checkbox"][data-type="file"][data-path^="${folderPath}/"]`);
        const visibleChildFiles = Array.from(childFiles).filter(cf => cf.closest('.tree-line').style.display !== 'none');
        if (visibleChildFiles.length > 0) {
            folderCb.checked = visibleChildFiles.every(c => c.checked);
        } else {
            folderCb.checked = false;
        }
    });
}

fileTree.addEventListener('change', (e) => {
    const target = e.target;
    if (target.matches('input[type="checkbox"][data-type="directory"]')) {
        const folderPath = target.dataset.path;
        const childFiles = fileTree.querySelectorAll(`input[type="checkbox"][data-type="file"][data-path^="${folderPath}/"]`);
        childFiles.forEach(cf => {
            if (cf.closest('.tree-line').style.display !== 'none') {
                if (!target.checked && filterSelectedPaths.has(cf.dataset.path)) {
                    filterSelectedPaths.delete(cf.dataset.path);
                }
                cf.checked = target.checked;
            }
        });
    } else if (target.matches('input[type="checkbox"][data-type="file"]') && !target.checked) {
        if (filterSelectedPaths.has(target.dataset.path)) {
            filterSelectedPaths.delete(target.dataset.path);
        }
    }
    updateFolderCheckboxes();
    updateTally();
});

async function buildAsciiTreeStructure(selectedFiles) {
    const root = {};
    for (const f of selectedFiles) {
        const parts = f.path.split('/');
        let current = root;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!current[part]) current[part] = { __isFile: (i === parts.length - 1), __size: f.size, __lines: f.lines };
            if (i < parts.length - 1) {
                current = current[part];
            }
        }
    }
    function printTree(obj, prefix = '', isLast = true) {
        const keys = Object.keys(obj).filter(k => !k.startsWith('__')).sort();
        let lines = [];
        keys.forEach((key, index) => {
            const val = obj[key];
            const last = (index === keys.length - 1);
            const connector = last ? '└── ' : '├── ';
            if (val.__isFile) {
                const sizeKb = (val.__size / 1024).toFixed(2);
                lines.push(prefix + connector + key + ` (Size: ${sizeKb}kb; Lines: ${val.__lines})`);
            } else {
                lines.push(prefix + connector + key + '/');
                const newPrefix = prefix + (last ? '    ' : '│   ');
                lines = lines.concat(printTree(val, newPrefix, last));
            }
        });
        return lines;
    }
    return printTree(root).join('\n');
}

async function minifyContent(path, content) {
    const lowerPath = path.toLowerCase();
    if (lowerPath.endsWith('.js') || lowerPath.endsWith('.jsx') || lowerPath.endsWith('.mjs') || lowerPath.endsWith('.cjs') || lowerPath.endsWith('.ts') || lowerPath.endsWith('.tsx')) {
        try {
            const result = await Terser.minify(content);
            return result.code || content;
        } catch {
            return content;
        }
    } else if (lowerPath.endsWith('.css')) {
        try {
            const result = csso.minify(content);
            return result.css || content;
        } catch {
            return content;
        }
    } else if (lowerPath.endsWith('.html') || lowerPath.endsWith('.htm')) {
        try {
            return htmlMinifierTerser.minify(content, {
                collapseWhitespace: true,
                removeComments: true,
                minifyCSS: true,
                minifyJS: true
            });
        } catch {
            return content;
        }
    } else if (lowerPath.endsWith('.json')) {
        try {
            const obj = JSON.parse(content);
            return JSON.stringify(obj);
        } catch {
            return content;
        }
    } else {
        return content.split('\n').map(l => l.trimEnd()).join('\n');
    }
}

function removeCommentsFromCode(path, content) {
    const ext = path.toLowerCase();
    let lines = content.split('\n');
    let result = lines.join('\n');
    // Heuristics:
    // JS/TS/TSX/JSX/C/C++/Java/Go/Rust/PHP/Ruby: remove // and /* */ style comments
    // Python: remove # comments
    // HTML: remove <!-- --> comments
    // CSS: remove /* */ comments
    // We'll do a generic approach based on extension:

    // For block comments, remove them using a generic regex if applicable.
    // For line comments, remove line by line.

    // Common block comment regex: /\/\*[\s\S]*?\*\//g
    // Common single-line comments: //.*$
    // HTML comments: <!--[\s\S]*?-->
    // Python/Ruby: ^\s*#.*

    if (ext.endsWith('.js') || ext.endsWith('.jsx') || ext.endsWith('.ts') || ext.endsWith('.tsx') || ext.endsWith('.java') || ext.endsWith('.go') || ext.endsWith('.c') || ext.endsWith('.cpp') || ext.endsWith('.h') || ext.endsWith('.rs') || ext.endsWith('.php')) {
        // Remove block comments
        result = result.replace(/\/\*[\s\S]*?\*\//g, '');
        // Remove line comments
        result = result.replace(/(^|\s)\/\/.*$/gm, '');
    } else if (ext.endsWith('.py') || ext.endsWith('.rb')) {
        // Python and Ruby style: lines starting with #
        result = result.replace(/^\s*#.*$/gm, '');
    } else if (ext.endsWith('.html') || ext.endsWith('.htm')) {
        // HTML comments
        result = result.replace(/<!--[\s\S]*?-->/g, '');
    } else if (ext.endsWith('.css')) {
        // CSS block comments
        result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    } else if (ext.endsWith('.jsx') || ext.endsWith('.tsx')) {
        // Already handled above with JS pattern
    }
    // Trim trailing spaces from lines after removal
    let processedLines = result.split('\n').map(l => l.trimEnd());
    // Remove empty lines that may be left by comment removal
    return processedLines.join('\n');
}

combineBtn.addEventListener('click', async () => {
    const selectedPaths = Array.from(fileTree.querySelectorAll('input[type="checkbox"]:checked[data-type="file"]'))
        .map(cb => cb.dataset.path);
    if (selectedPaths.length === 0) {
        showGlobalMessage('Please select at least one text file');
        return;
    }
    setLoading(true, 'Combining selected files...');
    try {
        const selectedFiles = [];
        let originalTotalSize = 0;
        let originalTotalLines = 0;

        for (const path of selectedPaths) {
            loadingText.textContent = `Processing: ${path}`;
            const fh = fileHandles.find(f => f.path === path);
            if (!fh) continue;
            const file = await fh.handle.getFile();
            const content = await file.text();
            selectedFiles.push({
                path,
                content,
                size: fh.size,
                lines: fh.lines
            });
            originalTotalSize += fh.size;
            originalTotalLines += fh.lines;
        }

        let finalOutput = '';
        if (includePreamble.checked && customPreamble.value.trim()) {
            finalOutput += customPreamble.value.trim() + '\n\n';
        }
        if (includeGoal.checked && goalText.value.trim()) {
            finalOutput += "Goal:\n" + goalText.value.trim() + '\n\n';
        }

        const asciiSummary = await buildAsciiTreeStructure(selectedFiles);
        if (asciiSummary.trim()) {
            finalOutput += "Project Structure:\n" + asciiSummary + "\n\n";
        }

        let combinedContent = '';
        let afterCommentTotalSize = 0;
        let afterCommentTotalLines = 0;
        let afterMinifyTotalSize = 0;
        let afterMinifyTotalLines = 0;

        // Remove comments first if checked
        for (const f of selectedFiles) {
            let fileContent = f.content.trim();
            if (removeComments.checked) {
                fileContent = removeCommentsFromCode(f.path, fileContent);
            }
            const linesCount = fileContent.split('\n').length;
            const sizeCount = new Blob([fileContent]).size;
            afterCommentTotalSize += sizeCount;
            afterCommentTotalLines += linesCount;
        }

        let intermediateFiles = selectedFiles.map(f => {
            let fileContent = f.content.trim();
            if (removeComments.checked) {
                fileContent = removeCommentsFromCode(f.path, fileContent);
            }
            return { path: f.path, content: fileContent };
        });

        // Then minify if checked
        if (minifyOutput.checked) {
            let tempFiles = [];
            for (const f of intermediateFiles) {
                let minContent = await minifyContent(f.path, f.content);
                tempFiles.push({ path: f.path, content: minContent });
            }
            intermediateFiles = tempFiles;
        }

        // After all transformations
        for (const f of intermediateFiles) {
            combinedContent += `---\n${f.path}\n---\n${f.content}\n\n`;
        }

        // Compute final stats
        const finalSize = new Blob([combinedContent]).size;
        const finalLines = combinedContent.split('\n').length;

        finalOutput += combinedContent.trim();
        combinedOutput.value = finalOutput;
        output.classList.remove('hidden');
        showGlobalMessage('Files combined successfully!', 'success');
        output.scrollIntoView({ behavior: 'smooth', block: 'start' });

        if (removeComments.checked) {
            const savedSize = ((originalTotalSize - afterCommentTotalSize) / 1024).toFixed(2);
            const sizePct = ((originalTotalSize - afterCommentTotalSize) / originalTotalSize * 100).toFixed(1);
            const savedLines = (originalTotalLines - afterCommentTotalLines);
            const linePct = (savedLines / originalTotalLines * 100).toFixed(1);
            commentStats.textContent = `Removing comments saved ${savedSize} KB (${sizePct}%) and ${savedLines} lines (${linePct}%)`;
            commentStats.classList.remove('hidden');
        } else {
            commentStats.classList.add('hidden');
        }

        if (minifyOutput.checked) {
            const savedSize = ((afterCommentTotalSize - finalSize) / 1024).toFixed(2);
            const sizePct = ((afterCommentTotalSize - finalSize)/afterCommentTotalSize*100).toFixed(1);
            const savedLines = (afterCommentTotalLines - finalLines);
            const linePct = (savedLines / afterCommentTotalLines * 100).toFixed(1);
            minifyStats.textContent = `Minifying the outputs saved ${savedSize} KB (${sizePct}%) and ${savedLines} lines (${linePct}%)`;
            minifyStats.classList.remove('hidden');
        } else {
            minifyStats.classList.add('hidden');
        }

    } catch (error) {
        showGlobalMessage('Error combining files: ' + error.message);
    } finally {
        setLoading(false);
    }
});

downloadBtn.addEventListener('click', () => {
    const blob = new Blob([combinedOutput.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'combined_files.txt';
    a.click();
    URL.revokeObjectURL(url);
});

copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(combinedOutput.value);
        showGlobalMessage('Combined text copied to clipboard!', 'success');
    } catch (err) {
        showGlobalMessage('Failed to copy: ' + err.message);
    }
});

const refreshBtn = document.getElementById('refreshBtn');

refreshBtn.addEventListener('click', async () => {
    if (!folderHandle) {
        showGlobalMessage('Please select a folder first before refreshing.', 'error');
        return;
    }

    // Store current selections
    const selectedPaths = new Set(
        Array.from(fileTree.querySelectorAll('input[type="checkbox"]:checked[data-type="file"]'))
            .map(cb => cb.dataset.path)
    );

    // Clear current tree and handles
    fileTree.innerHTML = '';
    fileHandles = [];
    pathToElement = {};

    // Rescan folder
    setLoading(true, 'Refreshing folder contents...');
    try {
        await tryReadGitignore(folderHandle);
        await buildFileTree(folderHandle);

        // Restore selections
        const checkboxes = fileTree.querySelectorAll('input[type="checkbox"][data-type="file"]');
        checkboxes.forEach(cb => {
            if (selectedPaths.has(cb.dataset.path)) {
                cb.checked = true;
            }
        });

        updateFolderCheckboxes();
        updateTally();
        refreshBtn.classList.remove('hidden');
        showGlobalMessage('Folder refreshed successfully!', 'success');
        applyTooltips();
    } catch (err) {
        console.error('Error refreshing folder:', err);
        showGlobalMessage('Error refreshing folder: ' + err.message, 'error');
    } finally {
        setLoading(false);
    }
});

savePresetBtn.addEventListener('click', savePreset);
loadPresetBtn.addEventListener('click', loadPreset);
deletePresetBtn.addEventListener('click', deletePreset);

function applyTooltips() {
    tippy('[data-tippy-content]', {
        theme: 'light-border',
        delay: [200, 100],
        maxWidth: 250,
    });
}

function updateTally() {
    const selectedCheckboxes = Array.from(fileTree.querySelectorAll('input[type="checkbox"][data-type="file"]:checked'));
    let totalSize = 0;
    let totalLines = 0;
    for (const cb of selectedCheckboxes) {
        const fh = fileHandles.find(f => f.path === cb.dataset.path);
        if (fh) {
            totalSize += fh.size;
            totalLines += fh.lines;
        }
    }

    const currentDisplaySize = parseFloat(totalSizeDisplay.textContent.replace(' KB', '')) || 0;
    const targetSizeKB = totalSize / 1024;
    animateNumber(totalSizeDisplay, currentDisplaySize, targetSizeKB, ' KB', 2);

    const currentDisplayLines = parseInt(totalLinesDisplay.textContent.replace(/,/g, ''), 10) || 0;
    animateNumber(totalLinesDisplay, currentDisplayLines, totalLines, '', 0);

    if ((totalSize / 1024) > 500) {
        tallyWarning.textContent = "Warning: probably too large to fit in Claude 3.5 Sonnet context window!";
    } else if ((totalSize / 1024) > 200) {
        tallyWarning.textContent = "Warning: probably too large to fit in GPT-4o or o1 context window!";
    } else {
        tallyWarning.textContent = "";
    }
}

function animateNumber(element, start, end, suffix, precision) {
    let current = Number(start);
    const target = Number(end);

    if (isNaN(current)) current = 0;
    if (isNaN(target)) {
        element.textContent = Number(0).toLocaleString(undefined, {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision
        }) + suffix;
        return;
    }

    const increment = (target - current) / 30; // Animate over approx 30 frames

    function step() {
        current += increment;
        let finished = false;

        if (increment === 0) {
            finished = true;
            current = target;
        } else if (increment > 0) {
            if (current >= target) {
                current = target;
                finished = true;
            }
        } else { // increment < 0
            if (current <= target) {
                current = target;
                finished = true;
            }
        }

        element.textContent = Number(current).toLocaleString(undefined, {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision
        }) + suffix;

        if (!finished) {
            requestAnimationFrame(step);
        }
    }
    requestAnimationFrame(step);
}

fileTree.addEventListener('change', updateTally);

filterInput.addEventListener('input', applyFilter);
clearFilterBtn.addEventListener('click', () => {
    filterInput.value = '';
    applyFilter();
});

function applyFilter() {
    const query = filterInput.value.toLowerCase().trim();
    if (!query) {
        for (const path in pathToElement) {
            pathToElement[path].style.display = '';
        }
        updateFolderCheckboxes();
        return;
    }
    for (const path in pathToElement) {
        pathToElement[path].style.display = 'none';
    }
    const matchedPaths = Object.keys(pathToElement).filter(p => p.toLowerCase().includes(query));
    matchedPaths.forEach(p => {
        let parts = p.split('/');
        let currentPath = '';
        for (let i = 0; i < parts.length; i++) {
            currentPath = i === 0 ? parts[i] : currentPath + '/' + parts[i];
            if (pathToElement[currentPath]) {
                pathToElement[currentPath].style.display = '';
            }
        }
    });
    updateFolderCheckboxes();
}

const fileTypePatterns = {
    js: [".js", ".mjs", ".cjs"],
    react: [".jsx", ".tsx"],
    ts: [".ts", ".tsx"],
    json: [".json"],
    md: [".md"],
    py: [".py"],
    go: [".go"],
    java: [".java"],
    rb: [".rb"],
    php: [".php"],
    rs: [".rs"]
};

fileTypeFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.filterType;
        const patterns = fileTypePatterns[type] || [];
        const fileCheckboxes = fileTree.querySelectorAll('input[type="checkbox"][data-type="file"]');

        for (const cb of fileCheckboxes) {
            const filePath = cb.dataset.path.toLowerCase();
            if (patterns.some(ext => filePath.endsWith(ext))) {
                if (!cb.checked) {
                    cb.checked = true;
                    filterSelectedPaths.add(cb.dataset.path);
                }
            }
        }
        updateFolderCheckboxes();
        updateTally();
    });
});

clearFilterSelectionsBtn.addEventListener('click', () => {
    const fileCheckboxes = fileTree.querySelectorAll('input[type="checkbox"][data-type="file"]');
    for (const cb of fileCheckboxes) {
        if (filterSelectedPaths.has(cb.dataset.path)) {
            cb.checked = false;
        }
    }
    filterSelectedPaths.clear();
    updateFolderCheckboxes();
    updateTally();
});

// Event listener for adding custom text extensions
const customTextExtensionsInput = document.getElementById('customTextExtensionsInput');
const addCustomTextExtensionsBtn = document.getElementById('addCustomTextExtensionsBtn');

if (customTextExtensionsInput && addCustomTextExtensionsBtn) {
    addCustomTextExtensionsBtn.addEventListener('click', async () => {
        const rawInput = customTextExtensionsInput.value.trim();
        if (!rawInput) {
            showGlobalMessage('Please enter one or more extensions (e.g., .mdc, .ext2)', 'error');
            return;
        }

        const newExtensions = rawInput.split(',')
            .map(ext => {
                let cleanedExt = ext.trim().toLowerCase();
                if (cleanedExt && !cleanedExt.startsWith('.')) {
                    cleanedExt = '.' + cleanedExt;
                }
                return cleanedExt;
            })
            .filter(ext => ext.length > 1 && ext.startsWith('.')) // Basic validation
            .filter(ext => !userAddedTextExtensions.includes(ext)); // Avoid duplicates

        if (newExtensions.length === 0) {
            showGlobalMessage('No valid new extensions to add, or extensions already added/empty.', 'error');
            customTextExtensionsInput.value = ''; // Clear input
            return;
        }

        userAddedTextExtensions.push(...newExtensions);
        saveCustomExtensions(); // Save to localStorage
        customTextExtensionsInput.value = ''; // Clear input
        
        showGlobalMessage(`Added extensions: ${newExtensions.join(', ')}. Refreshing folder if one is selected...`, 'success');

        // Trigger a refresh of the file tree to re-evaluate file types
        const refreshButton = document.getElementById('refreshBtn');
        if (folderHandle && refreshButton && !refreshButton.classList.contains('hidden')) {
            refreshButton.click(); // This handles setLoading internally and preserves selections
        } else if (folderHandle) {
            // Fallback refresh if refresh button isn't available but folder is selected
            // This is a simplified refresh, might not preserve all states like refreshBtn does.
            setLoading(true, 'Re-evaluating file types and refreshing folder...');
            try {
                fileTree.innerHTML = '';
                fileHandles = [];
                pathToElement = {};
                await tryReadGitignore(folderHandle);
                await buildFileTree(folderHandle); // This will now use updated isTextFile
                updateFolderCheckboxes();
                updateTally();
                applyTooltips(); // Reapply tooltips to new elements
                showGlobalMessage('Folder refreshed with new extensions.', 'success');
            } catch (err) {
                console.error('Error during manual refresh for custom extensions:', err);
                showGlobalMessage('Error re-evaluating files: ' + err.message, 'error');
            } finally {
                setLoading(false);
            }
        } else {
            showGlobalMessage(`Added extensions: ${newExtensions.join(', ')}. Select or re-select a folder to apply.`, 'info');
        }
    });
} 