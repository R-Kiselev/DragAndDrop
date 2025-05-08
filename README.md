# Drag&Drop

## About This Project

Drag&Drop is a simple web application that allows users to upload files and view their text-based content directly in the browser. It's particularly useful for quickly inspecting configuration files, scripts, or any text-based documents without needing to download them or open them in a separate application.

The application also provides a feature to copy all extracted text content to the clipboard for easy sharing or use elsewhere. For binary files, it indicates that the content cannot be displayed as text.

## Features

*   **File Upload:** Users can drag and drop files or use a file selector to upload one or more files or just paste files (Ctrl+V).
*   **Content Display:**
    *   Text-based files (e.g., `.txt`, `.js`, `.py`, `.json`, `.md`, `.html`, `.css`, etc.) have their content displayed.
    *   Syntax highlighting is provided for common code file types.
    *   Binary files (e.g., images, executables) are identified, and a message is shown indicating that their content cannot be previewed as text.
*   **Copy to Clipboard:** A button allows users to copy the concatenated text content of all readable files.
*   **Responsive Design:** The interface is designed to work on various screen sizes.
*   **Smooth Animations:** User interactions are enhanced with smooth transitions and animations.
*   **Scroll to Top:** A convenient panel on the right side allows users to quickly scroll back to the top of the page when content is long.

## Tech Stack

*   **Frontend:** React.js
*   **Backend:** FastAPI (Python)
*   **Styling:** CSS

## How It Works

1.  **Upload:** The user uploads files through the web interface.
2.  **Processing (Backend):** The FastAPI backend receives the files.
    *   It attempts to read and decode text-based files (UTF-8).
    *   It identifies binary files and notes their type.
3.  **Display (Frontend):** The React frontend receives the processed file information.
    *   It displays the content of text files, applying syntax highlighting where appropriate.
    *   For binary files, it shows a notification.
    *   It handles errors gracefully, informing the user if a file cannot be processed.

## Potential Future Enhancements

*   Support for more character encodings.
*   Preview for certain types of binary files (e.g., image thumbnails).
*   Ability to download individual processed files.
*   User authentication and private file storage.
*   More advanced client-side file type validation.

---

This project serves as a practical example of building a full-stack application with React and FastAPI, focusing on file handling and a user-friendly interface.