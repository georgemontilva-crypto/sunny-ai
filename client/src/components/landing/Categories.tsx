import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Bone, Dna, Activity, Zap } from "lucide-react";

const categories = [
  {
    icon: Bone,
    title: "Recuperación y tejido",
    description:
      "Compuestos cuya investigación se centra en modelos de reparación de tejido: tendones, ligamentos y tracto gastrointestinal.",
  },
  {
    icon: Dna,
    title: "Longevidad y salud celular",
    description:
      "Líneas de investigación sobre senescencia celular, regeneración y marcadores asociados al envejecimiento.",
  },
  {
    icon: Activity,
    title: "Metabolismo y composición corporal",
    description:
      "Estudios sobre función mitocondrial, metabolismo energético y su relación con la composición corporal.",
  },
  {
    icon: Zap,
    title: "Eje hormonal y rendimiento",
    description:
      "Investigación centrada en secretagogos y análogos que interactúan con el eje de la hormona de crecimiento.",
  },
];

export default function Categories() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-4 section-bg-alt" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Cuatro áreas de investigación
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Así organizamos la literatura disponible. Cada compuesto de nuestra biblioteca cae en al
            menos una de estas categorías.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-2xl bg-card border border-border p-6"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <cat.icon className="w-5 h-5 text-dorado-texto" />
              </div>
              <h3 className="font-semibold mb-2">{cat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
