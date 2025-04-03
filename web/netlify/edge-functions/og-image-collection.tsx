import { ImageResponse } from "https://deno.land/x/og_edge/mod.ts";
import React from "https://esm.sh/react@18.2.0";
import type { Config, Context } from "@netlify/edge-functions";

async function fetchCollection(baseUrl: string, id: string): Promise<{ id: string; name: string }> {
  if (id === "default") {
    return { id: "default", name: "Default" };
  }
  const response = await fetch(`${baseUrl}/.netlify/functions/collections-handler/${id}`);
  const data = await response.json();

  return data.data.map((x: { id: number; name: string }) => ({
    name: x.name,
    id: x.id.toString(),
  }))[0];
}

export default async (request: Request, context: Context) => {
  try {
    const match = request.url.match(/og-images\/collections\/(?<collectionId>[^/]+)/);
    const { collectionId = "" } = match?.groups || {};

    const collection = await fetchCollection(context.site.url, collectionId);
    if (!collection) {
      return new ImageResponse(
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            color: "#FFF",
          }}
        >
          <img
            alt="Seer Card"
            width="2400"
            src="https://cdn.kleros.link/ipfs/Qmbxw66xbRG9hLt7jh5hERqULkQmeiEYT3sJx7wriapGwA/seer-twitter-card-v2.jpg"
          />
        </div>,
        { width: 2400, height: 1350, debug: false },
      );
    }

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          color: "#FFF",
        }}
      >
        <img
          alt="seer background"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
          src="https://cdn.kleros.link/ipfs/QmRZoc5ehDFASXBbHNo41W8ifWXc7Fe7AJWBkipt5cPm9d/seer-background.png"
        ></img>
        <div style={{ display: "flex", flexDirection: "column", padding: 48, width: "100%" }}>
          <div style={{ display: "flex" }}>
            <img
              alt="Seer Logo"
              width="114"
              src="https://cdn.kleros.link/ipfs/QmSY7h5zeipL6rELiGwbcHDtNgBm83QxwkPtkFbxAA2N8p/seer-logo-all-white.png"
            />
          </div>
          <p
            style={{
              display: "flex",
              fontSize: 80,
              marginTop: 24,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            {collection.name.length > 55 ? `${collection.name.slice(0, 55 - 3)}...` : collection.name}
          </p>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 32 }}>
            <div style={{ backgroundColor: "#8B52F6", width: 100, height: 4, marginBottom: 16 }}></div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <div style={{ display: "flex" }}>
                <img
                  alt="Collection Icon"
                  width={80}
                  src="https://cdn.kleros.link/ipfs/QmX3yV3skWwyN2u3xwHkfwCESajoQizGHqCZUovydHj5qT/seer-collection.png"
                />
              </div>
              <p
                style={{
                  display: "flex",
                  fontSize: 48,
                  color: "#C496FF",
                  fontWeight: 600,
                }}
              >
                Collection
              </p>
            </div>
          </div>
        </div>
        <img
          alt="seer collection cards"
          style={{
            position: "absolute",
            bottom: 100,
            right: 88,
            width: 165,
          }}
          src="https://cdn.kleros.link/ipfs/QmeXJUnVi35foB2Wmkx3nzCeskdcBmuZSqz5yXn3MwXgPy/seer-collection-cards.png"
        ></img>
      </div>,
      { debug: false },
    );
  } catch (e) {
    console.log(e);
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          color: "#FFF",
        }}
      >
        <img
          alt="Seer Card"
          width="2400"
          src="https://cdn.kleros.link/ipfs/Qmbxw66xbRG9hLt7jh5hERqULkQmeiEYT3sJx7wriapGwA/seer-twitter-card-v2.jpg"
        />
      </div>,
      { width: 2400, height: 1350, debug: false },
    );
  }
};

export const config: Config = { path: "/og-images/collections/:collectionId" };
