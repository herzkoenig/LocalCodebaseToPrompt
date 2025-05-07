# LocalCodebaseToPrompt
## Usage

You have two options to use LocalCodebaseToPrompt:

1.  **Local Download:**
    * Download [`LocalCodebaseToPrompt-SingleFile.html`](https://raw.githubusercontent.com/herzkoenig/LocalCodebaseToPrompt/main/LocalCodebaseToPrompt-SingleFile.html) (Right-click and "Save Link As...")
    * Open the downloaded HTML file directly in your web browser. No installation or web server is needed.
2.  **Online Version:**
    * Access it directly online [here](https://htmlpreview.github.io/?https://github.com/herzkoenig/LocalCodebaseToPrompt/blob/main/LocalCodebaseToPrompt-SingleFile.html).

## Browser Compatibility
For best results, use a Chromium-based browser that fully supports the File System Access API, and make sure it is not restricted in the browser settings.

## Screenshot
<div align="center">
   <img src="https://github.com/user-attachments/assets/121fea3a-66be-4996-b23c-cef4156e28c8" alt="image" style="width: 75%;">
</div>

## Notes about this fork
This project extends the excellent [your-source-to-prompt.html](https://github.com/Dicklesworthstone/your-source-to-prompt.html), originally created by Dicklesworthstone.

To enhance the development experience, this version uses separate files within an `src` folder, as developing within a single HTML file can be cumbersome.

However, I greatly appreciate the benefits of a single-file format—its ease of copying, sharing, and standalone use. Therefore, I've implemented a build process using Vite and the *`vite-plugin-singlefile`* plugin. This process bundles the separated source files back into one self-contained HTML file named LocalCodebaseToPrompt-SingleFile.html.

The resulting **`LocalCodebaseToPrompt-SingleFile.html`** output retains the simplicity and portability of the original your-source-to-prompt.html.

## Added Features
*   **Define Custom Text File Types**: You can now add additional text-based file extensions. This ensures files you need are selectable for your prompt and not ignored as *(non-text file)*.

