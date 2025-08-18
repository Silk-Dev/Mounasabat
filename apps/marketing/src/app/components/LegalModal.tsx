"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "ui";
import Link from "next/link";
import Image from "next/image";

export default function LegalModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  const handleAccept = () => setOpen(false);
  const handleRefuse = () => setOpen(false);
  const handleLearnMore = () => window.open("/confidentialite", "_blank");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-2xl w-full bg-[#FFF1E8] rounded-2xl shadow-2xl p-4 flex flex-row items-center justify-center mx-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed border border-[#1BA3A9] gap-6
    md:flex-row flex-col"
        style={{ color: "#3A3A3A" }}
      >
        {/* Image à gauche */}
        <div className="flex-shrink-0 flex justify-center items-center w-[110px]">
          <Image src="/pcookie.png" alt="Cookie" width={90} height={90} />
        </div>
        {/* Texte et boutons à droite */}
        <div className="flex flex-col flex-1 items-center md:items-start">
          <DialogHeader className="w-full">
            <DialogTitle className="text-left text-2xl font-bold mb-2" style={{ color: "#3A3A3A" }}>
              Nous respectons la vie privée de nos utilisateurs.<br />Vos données, vos choix.
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-left text-base mb-4" style={{ color: "#3A3A3A" }}>
            Monasabet et ses partenaires utilisent des cookies et des informations non sensibles pour <span className="font-bold">assurer le bon fonctionnement du site, mesurer l'audience et les contenus consultés</span> ou personnaliser les contenus affichés.<br /><br />
            Pour en savoir plus sur les cookies, les données utilisées et leur traitement, vous pouvez consulter <Link href="/confidentialite" className="text-[#1BA3A9] underline">notre politique de confidentialité</Link> et nos engagements en matière de <Link href="/securite" className="text-[#1BA3A9] underline">sécurité et de confidentialité des données personnelles</Link>.
          </DialogDescription>
          <DialogFooter className="flex flex-row justify-start gap-4 w-full mt-2">
            <button
              onClick={handleLearnMore}
              className="border border-[#1BA3A9] text-[#1BA3A9] px-5 py-2 rounded font-semibold hover:bg-[#e3f8f8] transition"
            >
              EN SAVOIR PLUS
            </button>
            <button
              onClick={handleRefuse}
              className="border border-[#F16462] text-[#F16462] bg-white px-5 py-2 rounded font-semibold hover:bg-[#FFF1E8] transition"
            >
              REFUSER
            </button>
            <button
              onClick={handleAccept}
              className="bg-[#F16462] text-white px-5 py-2 rounded font-semibold hover:bg-[#d63d3d] transition"
            >
              ACCEPTER
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
} 