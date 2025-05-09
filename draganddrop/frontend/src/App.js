// src/App.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

function App() {
  const [responseData, setResponseData] = useState([]);
  const [error, setError] = useState(null); // Для глобальных ошибок запроса
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState('idle');
  const [appAlignedTop, setAppAlignedTop] = useState(false);
  const [showScrollPanel, setShowScrollPanel] = useState(false);

  const appRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; // Укажите ваш URL

  const handleFiles = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) {
      return;
    }
    setLoading(true);
    setResponseData([]);
    setError(null);
    setAppAlignedTop(true);

    const formData = new FormData();
    acceptedFiles.forEach((file) => formData.append('files', file));

    try {
      // Эндпоинт /api/upload (или /upload, если нет префикса /api)
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Ожидаемая структура ответа:
      // response.data = { "files": [ {filename, content}, ... ] }
      // где "content" может быть реальным содержимым или сообщением об ошибке для файла

      if (response.data && Array.isArray(response.data.files)) {
        const processedFiles = response.data.files.map(file => {
          const isUtf8Error = file.content.startsWith("File is not a valid UTF-8 encoded text file.");
          const isTooLargeError = file.content === "File is too large to process.";
          // Другие ошибки, которые вы решите класть в content, можно добавить сюда

          const isErrorFile = isUtf8Error || isTooLargeError;

          return {
            filename: file.filename,
            content: file.content, // Содержит либо текст файла, либо сообщение об ошибке
            is_error_file: isErrorFile,
            // `content_type` не приходит от бэкенда в этой версии,
            // `is_binary` используется для UI (не пытаться подсветить ошибку как код)
            is_binary: isErrorFile, 
          };
        });

        setResponseData(processedFiles);

        const hasSuccessfulFiles = processedFiles.some(f => !f.is_error_file);
        if (processedFiles.length > 0 && !hasSuccessfulFiles) {
          setError("Все предоставленные файлы не удалось обработать как текстовые (проблемы с кодировкой, размером и т.д.). Подробности см. для каждого файла.");
        } else if (processedFiles.length === 0 && acceptedFiles.length > 0) {
          setError("Сервер вернул пустой список файлов. Возможно, произошла неизвестная ошибка при обработке на сервере.");
        }

      } else {
        console.error("Неожиданный формат ответа от сервера:", response.data);
        setError("Получен неожиданный формат ответа от сервера.");
        setResponseData([]);
      }

    } catch (err) {
      console.error('Полный объект ошибки при загрузке:', err.toJSON ? err.toJSON() : err);
      let displayErrorMessage = 'При загрузке файлов произошла непредвиденная ошибка. Пожалуйста, попробуйте снова.';

      if (err.response) {
        // Сервер ответил с кодом ошибки (4xx или 5xx)
        if (err.response.status === 413) {
          displayErrorMessage = 'Один или несколько файлов слишком велики. Сервер имеет ограничение на общий размер загружаемых данных. Пожалуйста, попробуйте загрузить файлы меньшего размера или меньшее количество файлов за раз.';
        } else if (err.response.data) {
          const data = err.response.data;
          // Обработка ошибок FastAPI (например, от ValueError/TypeError, которые вызывают BadRequestError)
          if (typeof data.detail === 'string') {
            displayErrorMessage = data.detail;
          } else if (Array.isArray(data.detail) && data.detail.length > 0 && data.detail[0].msg) { // Ошибки валидации FastAPI
            displayErrorMessage = "Ошибка валидации: " + data.detail.map(d_err => {
              const locPath = Array.isArray(d_err.loc) ? d_err.loc.filter(p => p !== 'body').join(' -> ') : '';
              return `${locPath ? locPath + ': ' : ''}${d_err.msg}`;
            }).join('; ');
          } else if (typeof data === 'string') {
            if (data.trim().toLowerCase().startsWith('<html>') || data.length > 300) {
              displayErrorMessage = `Ошибка сервера ${err.response.status}: ${err.response.statusText || 'Произошла ошибка на сервере.'}`;
            } else {
              displayErrorMessage = data;
            }
          } else {
            displayErrorMessage = `Ошибка сервера ${err.response.status}: ${err.response.statusText || 'Не удалось обработать запрос из-за проблемы на сервере.'}`;
          }
        } else {
          displayErrorMessage = `Ошибка сервера ${err.response.status}: ${err.response.statusText || 'Произошла неизвестная ошибка на сервере.'}`;
        }
      } else if (err.request) {
        displayErrorMessage = 'Не удается подключиться к серверу. Проверьте ваше сетевое соединение или убедитесь, что сервер запущен. Это также может быть проблема с CORS на стороне сервера.';
      } else if (err.message) {
        displayErrorMessage = `Ошибка приложения: ${err.message}`;
      }

      setError(displayErrorMessage);
      setResponseData([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]); // Убрал зависимости, которые не меняются или устанавливаются внутри

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    noClick: false,
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
      const filesToUpload = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) filesToUpload.push(file);
        }
      }
      if (filesToUpload.length > 0) handleFiles(filesToUpload);
    };
    window.addEventListener('paste', pasteHandler);
    return () => window.removeEventListener('paste', pasteHandler);
  }, [handleFiles]);

  const copyToClipboard = () => {
    if (copyState === 'copying') return;

    if (!navigator.clipboard) {
      const errorMessageText = 'Clipboard API (navigator.clipboard) is not available.';
      console.error(errorMessageText, 'Is the page served over HTTPS or on localhost? Current context secure:', window.isSecureContext);
      setError(errorMessageText + (window.isSecureContext ? ' Context is secure, but API still unavailable.' : ' Context is NOT secure (requires HTTPS or localhost).'));
      return;
    }

    setCopyState('copying');

    const textToCopy = responseData
      .filter(file => !file.is_error_file && file.content) // Копируем только контент успешно обработанных файлов
      .map((file) => `${file.filename}\n\n${file.content}`)
      .join('\n\n');

    if (!textToCopy) {
      setError("Нет текстового содержимого от успешно обработанных файлов для копирования.");
      setCopyState('idle');
      return;
    }

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopyState('success');
        setTimeout(() => setCopyState('idle'), 2000);
      })
      .catch((clipboardErr) => {
        const detailedErrorMessageText = `Failed to copy content to clipboard. Error: ${clipboardErr.name} - ${clipboardErr.message}`;
        console.error('Error using navigator.clipboard.writeText:', clipboardErr);
        setError(detailedErrorMessageText);
        setCopyState('idle');
      });
  };

  // contentType больше не приходит от бэкенда, поэтому убираем его из параметров getLanguage
  // isErrorFile теперь является частью объекта file в responseData
  const getLanguage = (filename /*, contentType - убран */) => {
    // contentType && contentType.startsWith("image/") - эта логика больше не применима без contentType
    // contentType && contentType.startsWith("application/pdf") - эта логика больше не применима

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
        // contentType === "application/json" - эта логика больше не применима
        // contentType === "application/xml" - эта логика больше не применима
        return 'text'; // По умолчанию 'text', если расширение не определено
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
          <h1>Text Extractor</h1>
          <p className="app-description">
            Easily extract text from multiple files. Drag & drop or select your files,
            and get the content displayed in a convenient, readable format.
          </p>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            {isDragActive ? <p>Drop the files here...</p> : <p>Drag 'n' drop files here, or click to select files</p>}
          </div>
          <p className="paste-instruction">Or paste files using Ctrl+V</p>
        </div>

        {showStatusOrResults && (
          <div className="results-block">
            {loading && <p className="loading">Processing files...</p>}
            {error && <p className="error-message">{typeof error === 'string' ? error : JSON.stringify(error)}</p>}

            {responseData.length > 0 && (
              <>
                <div className="results-header">
                  <h2>Extracted Content</h2>
                  <button 
                    onClick={copyToClipboard} 
                    className={copyState} 
                    disabled={copyState === 'copying' || responseData.every(f => f.is_error_file)}
                  >
                    {renderButtonText()}
                  </button>
                </div>
                <div className="file-list">
                  {responseData.map((file, index) => (
                    <div key={index} className="file-item">
                      {/* Убираем file-type, так как contentType не приходит */}
                      <h3 className="file-name">{file.filename}</h3>
                      {file.is_error_file ? (
                        <p className="binary-file-notice"> {/* Используем существующий стиль или создаем новый для ошибок */}
                          <strong>Ошибка обработки файла:</strong><br/>
                          {file.content} {/* file.content здесь - это сообщение об ошибке */}
                        </p>
                      ) : file.content ? (
                        <SyntaxHighlighter
                          language={getLanguage(file.filename)} // Передаем только filename
                          style={darcula}
                          showLineNumbers={true}
                          wrapLines={true}
                          codeTagProps={{ style: { whiteSpace: 'pre-wrap' } }}
                          lineNumberStyle={{ opacity: 0.5 }}
                        >
                          {file.content}
                        </SyntaxHighlighter>
                      ) : (
                        // Этот случай маловероятен, если is_error_file=false, то content должен быть
                        // Но оставим для полноты
                        <p className="empty-file-notice">Этот текстовый файл пуст или не содержит отображаемого контента.</p>
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