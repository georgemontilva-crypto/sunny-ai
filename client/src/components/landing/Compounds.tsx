import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beaker, Droplet, Dna, Shield, Zap, Rocket, Wind, Lightbulb } from "lucide-react";

const compounds = [
  {
    name: "BPC-157",
    category: "Tissue Repair",
    description: "Synthetic fragment from a gastric protective protein. Preclinical research explores its role in tendon, ligament, and gastrointestinal tissue repair.",
    icon: Beaker,
  },
  {
    name: "TB-500",
    category: "Recovery",
    description: "Synthetic version of thymosin beta-4 fragment. Studied in animal models for wound healing and cellular motility in basic cell biology.",
    icon: Droplet,
  },
  {
    name: "Epitalon",
    category: "Longevity",
    description: "Synthetic peptide from pineal gland research. Literature explores possible relationship with telomerase activity and cellular senescence markers.",
    icon: Dna,
  },
  {
    name: "GHK-Cu",
    category: "Skin Health",
    description: "Copper complex with naturally occurring tripeptide. Most published research in dermatology, focused on skin regeneration and collagen synthesis.",
    icon: Shield,
  },
  {
    name: "MOTS-c",
    category: "Metabolism",
    description: "Peptide derived from mitochondrial DNA. Preclinical studies explore its role in energy metabolism and insulin sensitivity.",
    icon: Zap,
  },
  {
    name: "Ipamorelin",
    category: "Growth Hormone",
    description: "Synthetic secretagogue designed to selectively stimulate growth hormone release. Literature compares it to other secretagogues for specificity.",
    icon: Rocket,
  },
  {
    name: "CJC-1295",
    category: "Growth Hormone",
    description: "Synthetic analog of growth hormone-releasing hormone (GHRH). Research explores its ability to prolong GH release signals.",
    icon: Wind,
  },
  {
    name: "Semax",
    category: "Cognition",
    description: "Synthetic heptapeptide. Research explores potential effects on cognitive function and neuroprotection in preclinical models.",
    icon: Lightbulb,
  },
];

export default function Compounds() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="compounds" className="py-24 px-4 bg-secondary/20" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Compound Library
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Research summaries in conditional language. No compounds here are evaluated for human use — no dosing, protocols, or medical claims.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {compounds.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
            >
              <Card className="p-6 h-full flex flex-col hover:shadow-md transition-shadow overflow-hidden">
                {/* COMPOUND CARD IMAGE PLACEHOLDER - 350x140px with icon */}
                <motion.div 
                  className="bg-gradient-to-br from-gray-300 to-gray-400 w-full h-32 rounded-lg mb-4 flex items-center justify-center text-gray-600 text-xs font-medium -mx-6 -mt-6 mb-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="text-center"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <c.icon className="w-10 h-10 mx-auto mb-1 opacity-60" />
                    <div className="font-bold text-xs">350 × 140px</div>
                    <div className="text-xs mt-0.5">{c.name}</div>
                  </motion.div>
                </motion.div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-lg">{c.name}</h3>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {c.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
