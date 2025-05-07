# LocalCodebaseToPrompt

This project is an extension and refactoring of the excellent tool [your-source-to-prompt.html](https://github.com/Dicklesworthstone/your-source-to-prompt.html) by Dicklesworthstone.

The original single-file version was neat and super easy to share, use, and copy. However, when it comes to development and adding features, a multi-file structure is easier to manage. So, for now, I've split it up.

I might add an automatic build process later to bundle these back into a single HTML file, offering that same convenient distribution as the original.

## Added Features
*   **Define Custom Text File Types**:
    You can now add additional text-based file extensions (e.g., `.log`, `.mdc`, `.schema`). This ensures files you need are selectable for your prompt and not ignored as "(non-text file)".

## Browser Compatibility
For best results, use a Chromium-based browser that fully supports the File System Access API.
