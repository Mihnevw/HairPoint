import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ServicesSection from './components/ServicesSection';
import Features from './components/Features';
import GallerySection from './components/GallerySection';
import FAQ from './components/FAQ';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section id="home">
          <HeroSection />
        </section>
        <section id="services" className="pt-16">
          <ServicesSection />
        </section>
        <section id="features" className="pt-16">
          <Features />
        </section>
        <section id="gallery" className="pt-16">
          <GallerySection />
        </section>
        <section id="faq" className="pt-16">
          <FAQ />
        </section>
        <section id="contact" className="pt-16">
          <ContactSection />
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default App;