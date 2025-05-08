import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

function App() {
  const [responseData, setResponseData] = useState([]);
  const [error, setError] = useState(null); // Может быть строкой или объектом ошибки
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState('idle');
  const [appAlignedTop, setAppAlignedTop] = useState(false);
  const [showScrollPanel, setShowScrollPanel] = useState(false);

  const appRef = useRef(null);

  const handleFiles = async (files) => {
    if (files.length === 0) return;
    setLoading(true);
    setResponseData([]);
    setError(null);
    setAppAlignedTop(true);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const response = await axios.post('http://localhost:8000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResponseData(response.data.files); // Бэкенд теперь возвращает { files: [...] }
    } catch (err) {
      console.error('Error uploading files:', err);
      if (err.response && err.response.data) {
        // НОВАЯ ЛОГИКА: FastAPI теперь возвращает detail как строку
        if (typeof err.response.data.detail === 'string') {
          setError(err.response.data.detail);
        } else if (err.response.data.msg) { // Запасной вариант, если вдруг старый формат где-то остался
             setError(`Error: ${err.response.data.error_type || 'UnknownError'} - ${err.response.data.msg}`);
        }
        else {
          // Если detail не строка, пытаемся показать как есть или общую ошибку
          setError(JSON.stringify(err.response.data) || 'An error occurred on the server.');
        }
      } else if (err.request) {
        setError('Could not connect to the server. Please try again later.');
      } else {
        setError('An unexpected error occurred during the request setup.');
      }
      setResponseData([]);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    noClick: false,
    // Можно добавить обработку типов файлов здесь, если нужно ограничить на клиенте
    // accept: {
    //   'text/*': ['.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.py'],
    //   'image/png': ['.png'],
    //   'image/jpeg': ['.jpg', '.jpeg'],
    // }
  });

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollPanel(window.pageYOffset > 300);
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const pasteHandler = (event) => {
      const items = event.clipboardData.items;
      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) handleFiles(files);
    };
    window.addEventListener('paste', pasteHandler);
    return () => window.removeEventListener('paste', pasteHandler);
  }, []);

  const copyToClipboard = () => {
    if (copyState === 'copying') return;
    setCopyState('copying');
    const textToCopy = responseData
      .filter(file => !file.is_binary && file.content) // Копируем только текстовые файлы с содержимым
      .map((file) => `${file.filename}\n\n${file.content}`)
      .join('\n\n');

    if (!textToCopy) {
        setError("No text content available to copy.");
        setCopyState('idle');
        return;
    }

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopyState('success');
        setTimeout(() => setCopyState('idle'), 2000);
      })
      .catch((err) => {
        setError('Failed to copy content to clipboard.');
        setCopyState('idle');
      });
  };

  const getLanguage = (filename, contentType) => { // Добавили contentType
    if (contentType && contentType.startsWith("image/")) return 'text'; // Для изображений не подсвечиваем код
    if (contentType && contentType.startsWith("application/pdf")) return 'text';

    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': case 'jsx': case 'ts': case 'tsx': return 'javascript';
      case 'py': return 'python';
      case 'html': case 'htm': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'xml': return 'xml';
      case 'yaml': case 'yml': case 'yml.tmpl': return 'yaml';
      case 'md': return 'markdown';
      case 'sh': case 'bash': return 'bash';
      case 'c': return 'c';
      case 'cpp': case 'cxx': return 'cpp';
      case 'java': return 'java';
      case 'php': case 'phtml': return 'php';
      case 'rb': return 'ruby';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'swift': return 'swift';
      case 'kt': case 'kts': return 'kotlin';
      case 'sql': return 'sql';
      case 'txt': return 'text';
      case 'asm': return 'nasm';
      default:
        // Попытка угадать по content_type, если расширение неизвестно
        if (contentType === "application/json") return "json";
        if (contentType === "application/xml") return "xml";
        // ... другие типы
        return 'text';
    }
  };

  const renderButtonText = () => {
    switch (copyState) {
      case 'copying': return 'Copying...';
      case 'success': return '✓ Copied!';
      default: return 'Copy All Content';
    }
  };

  const showStatusOrResults = loading || error || responseData.length > 0;

  useEffect(() => {
    if (showStatusOrResults) {
      setAppAlignedTop(true);
    }
  }, [showStatusOrResults]);

  return (
    <div ref={appRef} className={`App ${appAlignedTop ? 'has-results-active' : ''}`}>
      <div className="container">
        <div className={`upload-section ${showStatusOrResults ? 'has-results' : ''}`}>
          <h1>Drag&Drop</h1>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            {isDragActive ? <p>Drop the files here...</p> : <p>Drag 'n' drop files here, or click to select files</p>}
          </div>
          <p className="paste-instruction">Or paste files using Ctrl+V</p>
        </div>

        {showStatusOrResults && (
          <div className="results-block">
            {loading && <p className="loading">Processing files...</p>}
            {/* Отображаем ошибку более явно */}
            {error && <p className="error-message">{typeof error === 'string' ? error : JSON.stringify(error)}</p>}

            {responseData.length > 0 && (
              <>
                <div className="results-header">
                  <h2>Extracted Content</h2>
                  <button onClick={copyToClipboard} className={copyState} disabled={copyState === 'copying' || responseData.every(f => f.is_binary)}>
                    {renderButtonText()}
                  </button>
                </div>
                <div className="file-list">
                  {responseData.map((file, index) => (
                    <div key={index} className="file-item">
                      {/* ИЗМЕНЕННАЯ СТРОКА */}
                      <h3 className="file-name">{file.filename} <span className="file-type">{file.content_type}</span></h3>
                      {file.is_binary ? (
                        <p className="binary-file-notice">
                          This is a binary file. Content preview is not available.
                          {file.error_message && <><br/><span>Note: {file.error_message}</span></>}
                        </p>
                      ) : file.content ? (
                        <SyntaxHighlighter
                          language={getLanguage(file.filename, file.content_type)}
                          style={darcula}
                          showLineNumbers={true}
                          wrapLines={true}
                          codeTagProps={{ style: { whiteSpace: 'pre-wrap' } }}
                          lineNumberStyle={{ opacity: 0.5 }}
                        >
                          {file.content}
                        </SyntaxHighlighter>
                      ) : (
                        <p className="empty-file-notice">This text file appears to be empty or could not be read as text.</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div
        className={`scroll-to-top-panel ${showScrollPanel ? 'visible' : ''}`}
        onClick={scrollToTop}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && scrollToTop()}
        title="Scroll to top"
      >
        <span className="scroll-to-top-text">Вверх</span>
        <span className="scroll-to-top-arrow">↑</span>
      </div>
    </div>
  );
}

export default App;