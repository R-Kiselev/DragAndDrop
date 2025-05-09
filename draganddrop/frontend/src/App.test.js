import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the main title and description', () => {
  render(<App />);
  // Ищем новый заголовок
  const titleElement = screen.getByText(/Text Extractor/i);
  expect(titleElement).toBeInTheDocument();

  // Проверяем наличие описания
  const descriptionElement = screen.getByText(/Easily extract text from multiple files/i);
  expect(descriptionElement).toBeInTheDocument();
});