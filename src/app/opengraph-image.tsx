import { ImageResponse } from "next/og";
import { countWord, isVacant, lowestPrice, rupiah } from "@/data/rooms";
import { getRooms } from "@/lib/site-data";

export const alt = "Kost 3g, kost putri di Brayan, Medan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Gambar pratinjau saat tautan dibagikan di WhatsApp atau media sosial. */
export default async function OpengraphImage() {
  const { rooms } = await getRooms();
  const vacantRooms = rooms.filter(isVacant);
  const doors = rooms.slice(0, 7);
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#E8EEE3", padding: 72, gap: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#346854" }}>Kost 3g</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", fontSize: 76, fontWeight: 800, color: "#363B64", lineHeight: 1.05 }}>
              {vacantRooms.length
                ? `${countWord(vacantRooms.length)} kamar masih kosong.`
                : "Kost putri di Brayan, Medan."}
            </div>
            <div style={{ display: "flex", fontSize: 32, color: "#5A5F6E" }}>
              {`Kost putri di Brayan, Medan. Mulai ${rupiah(lowestPrice(rooms))} per bulan, tanpa deposit.`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", width: 360, alignContent: "center", gap: 20 }}>
          {doors.map((r) => (
            <div
              key={r.number}
              style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: 18,
                width: 72,
                height: 108,
                borderRadius: "36px 36px 0 0",
                background: r.status === "kosong" ? "#FE9D00" : "#346854",
                color: r.status === "kosong" ? "#363B64" : "#CCD9D4",
                fontSize: 34,
                fontWeight: 800,
              }}
            >
              {String(r.number)}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
