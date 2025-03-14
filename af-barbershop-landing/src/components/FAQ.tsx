import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onToggle }) => {
    return (
        <div className="border-b border-gray-200">
            <button
                onClick={onToggle}
                className="w-full py-6 flex justify-between items-center text-left"
            >
                <span className="text-lg font-medium text-gray-900">{question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                </motion.div>
            </button>
            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        key={`content-${question}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-gray-600">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const faqData = [
    {
        question: "Как да направя резервация?",
        answer: "Можете да направите резервация чрез бутона 'Резервирай час' в горната част на страницата или като се обадите на нашия телефон."
    },
    {
        question: "Как да отменя или променя резервация?",
        answer: "За да отмените или промените резервация, моля свържете се с нас по телефона или през системата за резервации поне 24 часа предварително."
    },
    {
        question: "Какви продукти използвате?",
        answer: "Използваме само професионални продукти от водещи марки като American Crew, Wahl, и други висококачествени продукти за коса и брада."
    },
    {
        question: "Колко време отнема една услуга?",
        answer: "Подстригването отнема около 30-45 минути, бръсненето около 30 минути, а боядисването може да отнеме 1-2 часа в зависимост от желания резултат."
    },
    {
        question: "Предлагате ли услуги за брада?",
        answer: "Да, предлагаме пълна гама от услуги за брада, включително оформяне, подстригване и цялостна поддръжка."
    }
];

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl font-bold mb-4">Често Задавани Въпроси</h2>
                    <p className="text-xl text-gray-600">
                        Отговори на най-често задаваните въпроси
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl mx-auto"
                >
                    {faqData.map((faq, index) => (
                        <FAQItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openIndex === index}
                            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default FAQ; 