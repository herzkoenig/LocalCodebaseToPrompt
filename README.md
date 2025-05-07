# LocalCodebaseToPrompt

This project extends the excellent [your-source-to-prompt.html](https://github.com/Dicklesworthstone/your-source-to-prompt.html), originally created by Dicklesworthstone.

To enhance the development experience, this version uses separate files within an `src` folder, as developing within a single HTML file can be cumbersome.

However, I greatly appreciate the benefits of a single-file format—its ease of copying, sharing, and standalone use. Therefore, I've implemented a build process using Vite and the *vite-plugin-singlefile* plugin. This process bundles the separated source files back into one self-contained HTML file named LocalCodebaseToPrompt-SingleFile.html.

The resulting `LocalCodebaseToPrompt-SingleFile.html` output retains the simplicity and portability of the original your-source-to-prompt.html. It can be easily shared and used anywhere without requiring any external dependencies.

## Added Features
*   **Define Custom Text File Types**:
    You can now add additional text-based file extensions (e.g., `.log`, `.mdc`, `.schema`). This ensures files you need are selectable for your prompt and not ignored as *(non-text file)*.

## Browser Compatibility
For best results, use a Chromium-based browser that fully supports the File System Access API.