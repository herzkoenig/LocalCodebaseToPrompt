# LocalCodebaseToPrompt

This project began as a single, ingenious `.html` file designed to help users combine local code files into a single prompt for Large Language Models (LLMs), running entirely securely on their own machine. You can find the spirit of the original concept in many tools that aimed to solve this common problem.

As "LocalCodebaseToPrompt" grew with more features and capabilities, its single-file nature became a bit unwieldy. This version represents an **extension and refactoring** of that core idea.

## Key Changes & Enhancements

*   **Modular Structure**: The primary change is the separation of the original monolithic HTML file into:
    *   `index.html`: The main application structure.
    *   `style.css`: All styling rules.
    *   `script.js`: The core JavaScript logic.
    This makes the project more maintainable and easier to understand.
*   **Enhanced File Handling**:
    *   Visual folder and file selection.
    *   Support for `.gitignore` patterns and user-defined text file extensions.
    *   Folder-level statistics (file and line counts) in the tree view.
*   **Advanced Output Customization**:
    *   Include custom preambles and goals with your prompt.
    *   Option to remove code comments.
    *   Minify output (JS, CSS, HTML, JSON) to save space.
    *   Automatic generation of a project structure summary.
*   **User Experience**:
    *   Dark mode and a user-friendly interface with tooltips.
    *   Real-time tally of selected file sizes and lines, with context window warnings.
    *   String-based filtering and quick-select buttons for file types.
*   **Presets**: Save and load selections and settings (`localStorage` or JSON export/import) for frequently used configurations.
*   **Purely Local & Secure**: Your code never leaves your machine. No server-side processing, no installation, no dependencies beyond a modern browser.

## How to Use

1.  **Download the Files**: Get `index.html`, `style.css`, and `script.js` from the **LocalCodebaseToPrompt** repository and place them in the same folder on your computer.
2.  **Open in Browser**: Open `index.html` in a modern Chromium-based browser (like Chrome or Edge).
3.  **Select Folder**: Click "Select Folder" to choose your project directory.
4.  **Filter & Select**: Use the file tree, filters, and selection buttons to choose the files for your prompt. Add custom text file extensions if needed.
5.  **Customize (Optional)**: Add a preamble, goal, remove comments, or enable minification.
6.  **Save Preset (Optional)**: If you'll reuse this setup, save it as a preset.
7.  **Combine**: Click "Combine Selected Files."
8.  **Use Output**: Copy the generated text or download it as a file to use with your LLM.

## Browser Compatibility

For best results, use a Chromium-based browser (Chrome, Edge, Opera, etc.) that fully supports the File System Access API, which is crucial for local folder access.

---

License: MIT License Applies

---

Thanks for your interest in my open-source project! I hope you find **LocalCodebaseToPrompt** useful. You might also find my commercial web apps useful, and I would really appreciate it if you checked them out:

**[YoutubeTranscriptOptimizer.com](https://youtubetranscriptoptimizer.com)** makes it really quick and easy to paste in a YouTube video URL and have it automatically generate not just a really accurate direct transcription, but also a super polished and beautifully formatted written document that can be used independently of the video.

The document basically sticks to the same material as discussed in the video, but it sounds much more like a real piece of writing and not just a transcript. It also lets you optionally generate quizzes based on the contents of the document, which can be either multiple choice or short-answer quizzes, and the multiple choice quizzes get turned into interactive HTML files that can be hosted and easily shared, where you can actually take the quiz and it will grade your answers and score the quiz for you.

**[FixMyDocuments.com](https://fixmydocuments.com/)** lets you submit any kind of document— PDFs (including scanned PDFs that require OCR), MS Word and Powerpoint files, images, audio files (mp3, m4a, etc.) —and turn them into highly optimized versions in nice markdown formatting, from which HTML and PDF versions are automatically generated. Once converted, you can also edit them directly in the site using the built-in markdown editor, where it saves a running revision history and regenerates the PDF/HTML versions.

In addition to just getting the optimized version of the document, you can also generate many other kinds of "derived documents" from the original: interactive multiple-choice quizzes that you can actually take and get graded on; slick looking presentation slides as PDF or HTML (using LaTeX and Reveal.js), an in-depth summary, a concept mind map (using Mermaid diagrams) and outline, custom lesson plans where you can select your target audience, a readability analysis and grade-level versions of your original document (good for simplifying concepts for students), Anki Flashcards that you can import directly into the Anki app or use on the site in a nice interface, and more.
