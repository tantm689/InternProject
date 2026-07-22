import { notFound } from "next/navigation";
import { prisma } from "../../db";
import VolumePdfManager from "./_components/volume-pdf-manager";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VolumeAdminPage({ params }: PageProps) {
  const { id } = await params;
  const volumeId = parseInt(id, 10);

  if (isNaN(volumeId)) {
    notFound();
  }

  const volume = await prisma.volume.findUnique({
    where: { id: volumeId },
  });

  if (!volume) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <VolumePdfManager volume={volume} />
      </div>
    </div>
  );
}
