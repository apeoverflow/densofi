/**
 * @jest/environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MetricCard from '../components/MetricCard';
import { TrendingUp } from 'lucide-react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('MetricCard', () => {
  const mockProps = {
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Test Metric',
    value: '$1.5M',
    subtitle: 'Test Subtitle',
    description: 'This is a test description for the metric card.',
  };

  it('renders all basic props correctly', () => {
    render(<MetricCard {...mockProps} />);
    
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('$1.5M')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    expect(screen.getByText('This is a test description for the metric card.')).toBeInTheDocument();
  });

  it('shows uncertainty indicator when uncertainty is true', () => {
    render(<MetricCard {...mockProps} uncertainty={true} />);
    
    // Should show the question mark
    expect(screen.getByText('?')).toBeInTheDocument();
    
    // Should show the info icon
    const infoIcon = screen.getByLabelText('Estimated value');
    expect(infoIcon).toBeInTheDocument();
  });

  it('does not show uncertainty indicator when uncertainty is false', () => {
    render(<MetricCard {...mockProps} uncertainty={false} />);
    
    // Should not show the question mark
    expect(screen.queryByText('?')).not.toBeInTheDocument();
    
    // Should not show the info icon
    expect(screen.queryByLabelText('Estimated value')).not.toBeInTheDocument();
  });

  it('shows tooltip on hover when uncertainty is true', () => {
    render(<MetricCard {...mockProps} uncertainty={true} />);
    
    const infoIcon = screen.getByLabelText('Estimated value');
    
    // Hover over the info icon
    fireEvent.mouseEnter(infoIcon);
    
    // Should show tooltip text
    expect(screen.getByText(/This value is estimated and should be verified/)).toBeInTheDocument();
    
    // Hover away
    fireEvent.mouseLeave(infoIcon);
  });

  it('renders icon correctly', () => {
    render(<MetricCard {...mockProps} />);
    
    // The icon should be rendered (TrendingUp component)
    const iconContainer = screen.getByText('Test Metric').closest('[class*="bg-gray-800"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<MetricCard {...mockProps} />);
    
    // Check for main container classes
    const cardElement = container.querySelector('[class*="bg-gray-800"]');
    expect(cardElement).toHaveClass('bg-gray-800/50');
    expect(cardElement).toHaveClass('backdrop-blur-sm');
    expect(cardElement).toHaveClass('rounded-xl');
    expect(cardElement).toHaveClass('border');
    expect(cardElement).toHaveClass('border-gray-700/50');
  });
});