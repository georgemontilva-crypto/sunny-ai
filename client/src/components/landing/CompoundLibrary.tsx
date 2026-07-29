import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";

// Cada entrada resume, en condicional, el área de investigación publicada de
// un compuesto. Deliberadamente NO incluye dosis, mg, protocolos, frecuencias
// ni vidas medias — ese dato no existe en este sitio, en ningún compuesto.
const compounds = [
  {
    name: "BPC-157",
    category: "Recuperación y tejido",
    description:
      "Fragmento sintético derivado de una proteína protectora gástrica. La investigación preclínica disponible —sobre todo en modelos animales— explora su papel en la reparación de tejido tendinoso, ligamentoso y gastrointestinal. No existen ensayos clínicos aleatorizados en humanos publicados.",
  },
  {
    name: "TB-500",
    category: "Recuperación y tejido",
    description:
      "Versión sintética de un fragmento de timosina beta-4, una proteína implicada en la regulación de actina celular. Se estudia en modelos animales de cicatrización de heridas y motilidad celular, en el ámbito de la biología celular básica.",
  },
  {
    name: "Epitalon",
    category: "Longevidad y salud celular",
    description:
      "Péptido sintético surgido de la investigación sobre la glándula pineal. La literatura disponible, mayormente en modelos animales, explora su posible relación con la actividad de la telomerasa y marcadores de senescencia celular.",
  },
  {
    name: "GHK-Cu",
    category: "Longevidad y salud celular",
    description:
      "Complejo de cobre con un tripéptido presente de forma natural en el plasma humano, cuya concentración declina con la edad. Es uno de los péptidos con más investigación publicada en dermatología, centrada en regeneración de piel y síntesis de colágeno.",
  },
  {
    name: "MOTS-c",
    category: "Metabolismo y composición corporal",
    description:
      "Péptido derivado del ADN mitocondrial. Los estudios disponibles, mayormente preclínicos, exploran su papel en el metabolismo energético y su posible relación con la sensibilidad a la insulina.",
  },
  {
    name: "Ipamorelin",
    category: "Eje hormonal y rendimiento",
    description:
      "Secretagogo sintético diseñado para estimular la liberación de hormona de crecimiento de forma selectiva. La literatura disponible lo compara con otros secretagogos por su perfil más específico sobre otros ejes hormonales.",
  },
  {
    name: "CJC-1295",
    category: "Eje hormonal y rendimiento",
    description:
      "Análogo sintético de la hormona liberadora de hormona de crecimiento (GHRH). La investigación disponible explora su capacidad de prolongar la señal de liberación de GH, con frecuencia estudiado junto a otros secretagogos.",
  },
];

export default function CompoundLibrary() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="biblioteca" className="py-24 px-4 section-bg-alt" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Biblioteca de compuestos
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Resúmenes de literatura publicada, en condicional. Ningún compuesto de esta lista ha sido
            evaluado por Sunny para uso humano — no hay dosis, protocolos ni indicaciones aquí, y no las
            va a haber.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {compounds.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-2xl bg-card border border-border p-6 flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-display font-semibold text-xl">{c.name}</h3>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {c.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
