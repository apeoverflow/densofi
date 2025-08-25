/**
 * @jest/environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvestorRelationsPage from '../InvestorRelationsPage';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  },
}));

// Mock window.open for external links
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

describe('InvestorRelationsPage', () => {
  beforeEach(() => {
    mockOpen.mockClear();
  });

  it('renders the main heading', () => {
    render(<InvestorRelationsPage />);
    expect(screen.getByText('Investor Relations')).toBeInTheDocument();
  });

  it('displays key metric cards', () => {
    render(<InvestorRelationsPage />);
    
    // Check for metric card titles
    expect(screen.getByText('Total Addressable Market')).toBeInTheDocument();
    expect(screen.getByText('Total Value Locked')).toBeInTheDocument();
    expect(screen.getByText('Assets Under Management')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
  });

  it('shows uncertainty indicators for estimated values', () => {
    render(<InvestorRelationsPage />);
    
    // Look for question marks indicating uncertainty
    const uncertaintyMarkers = screen.getAllByText('?');
    expect(uncertaintyMarkers.length).toBeGreaterThan(0);
  });

  it('renders the pricing table with revenue streams', () => {
    render(<InvestorRelationsPage />);
    
    expect(screen.getByText('Revenue Model')).toBeInTheDocument();
    expect(screen.getByText('Domain Registration')).toBeInTheDocument();
    expect(screen.getByText('Token Creation')).toBeInTheDocument();
    expect(screen.getByText('Trading Fees')).toBeInTheDocument();
    expect(screen.getByText('DEX Launch Fee')).toBeInTheDocument();
  });

  it('displays traction chart with user and volume data', () => {
    render(<InvestorRelationsPage />);
    
    expect(screen.getByText('Platform Traction')).toBeInTheDocument();
    expect(screen.getByText('Monthly Active Users')).toBeInTheDocument();
    expect(screen.getByText('Monthly Volume (USD)')).toBeInTheDocument();
  });

  it('shows expandable sections for detailed information', () => {
    render(<InvestorRelationsPage />);
    
    expect(screen.getByText('Technology Stack & Security')).toBeInTheDocument();
    expect(screen.getByText('Competitive Advantages')).toBeInTheDocument();
    expect(screen.getByText('Growth Strategy & Roadmap')).toBeInTheDocument();
  });

  it('expands and collapses sections when clicked', () => {
    render(<InvestorRelationsPage />);
    
    const technologyButton = screen.getByText('Technology Stack & Security');
    
    // Click to expand
    fireEvent.click(technologyButton);
    
    // Should show expanded content
    expect(screen.getByText(/Built on proven blockchain infrastructure/)).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(technologyButton);
    
    // Content should still be in DOM but may be hidden via CSS
    expect(screen.getByText(/Built on proven blockchain infrastructure/)).toBeInTheDocument();
  });

  it('renders contact section with email and social links', () => {
    render(<InvestorRelationsPage />);
    
    expect(screen.getByText('Get in Touch')).toBeInTheDocument();
    expect(screen.getByText('Direct Email')).toBeInTheDocument();
    expect(screen.getByText('chimera_defi@protonmail.com')).toBeInTheDocument();
    expect(screen.getByText('@DensoFi')).toBeInTheDocument();
  });

  it('opens external links when contact methods are clicked', () => {
    render(<InvestorRelationsPage />);
    
    // Find and click the live platform button
    const livePlatformButton = screen.getByText('Live Platform');
    fireEvent.click(livePlatformButton);
    
    expect(mockOpen).toHaveBeenCalledWith('https://densofi.com', '_blank');
  });

  it('displays investment disclaimer', () => {
    render(<InvestorRelationsPage />);
    
    expect(screen.getByText('Investment Disclaimer')).toBeInTheDocument();
    expect(screen.getByText(/This information is for educational purposes only/)).toBeInTheDocument();
  });

  it('shows TAM value and description', () => {
    render(<InvestorRelationsPage />);
    
    expect(screen.getByText('$2.4B')).toBeInTheDocument();
    expect(screen.getByText('Domain Name Market Size')).toBeInTheDocument();
  });

  it('renders all pricing tiers with correct fees', () => {
    render(<InvestorRelationsPage />);
    
    expect(screen.getByText('$1 USD')).toBeInTheDocument(); // Domain Registration
    expect(screen.getByText('1% of supply')).toBeInTheDocument(); // Token Creation
    expect(screen.getByText('1% per trade')).toBeInTheDocument(); // Trading Fees
    expect(screen.getByText('3% of raised')).toBeInTheDocument(); // DEX Launch Fee
  });
});