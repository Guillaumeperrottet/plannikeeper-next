import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/24/outline";

const faqs = [
  { q: "What is Lorem Ipsum?", a: "Lorem ipsum dolor sit amet..." },
  { q: "How does this work?", a: "It uses Headless UI for the accordion." },
  {
    q: "Can I customize it?",
    a: "Yes, Tailwind classes are fully customizable.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="container mx-auto px-6 py-20">
      <h2 className="text-4xl font-bold text-center mb-12">FAQ</h2>
      <ul className="space-y-4">
        {faqs.map(({ q, a }) => (
          <Disclosure key={q} as="li" className="border-b pb-4">
            {({ open }) => (
              <>
                <Disclosure.Button className="flex justify-between w-full text-left">
                  <span className="font-medium">{q}</span>
                  <ChevronUpIcon
                    className={`${open ? "rotate-180" : ""} h-5 w-5`}
                  />
                </Disclosure.Button>
                <Disclosure.Panel className="mt-2 text-gray-600">
                  {a}
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        ))}
      </ul>
    </section>
  );
}
