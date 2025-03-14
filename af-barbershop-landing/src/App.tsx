import Hero from './components/Hero';
import Services from './components/Services';
import Features from './components/Features';
import FAQ from './components/FAQ';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Services />
      <Features />
      <FAQ />
      <ContactForm />
      <Footer />
    </div>
  );
}

export default App;
