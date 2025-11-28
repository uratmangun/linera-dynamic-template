import { z } from "zod";

const WaveHackId = "X4ZV12Z6GSMEkmOkX";
const BaseUrl = "https://api.akindo.io/public";

// Define schemas based on observed response
const WaveSchema = z.object({
  id: z.string(),
  waveCount: z.number(),
  // other fields ignored for now
});

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string().nullable().optional(),
  deliverableUrl: z.string().nullable().optional(),
  githubRepositoryName: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
});

const SubmissionSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  waveId: z.string(),
  productId: z.string(),
  comment: z.string().nullable().optional(),
  product: ProductSchema,
});

const SubmissionsResponseSchema = z.object({
  wave: WaveSchema,
  submissions: z.array(SubmissionSchema),
});

async function fetchAllSubmissions() {
  console.log(`Fetching waves for WaveHack: ${WaveHackId}...`);
  
  // 1. Fetch Waves
  const wavesRes = await fetch(`${BaseUrl}/wave-hacks/${WaveHackId}/waves`);
  if (!wavesRes.ok) {
    throw new Error(`Failed to fetch waves: ${wavesRes.statusText}`);
  }
  
  const wavesData = await wavesRes.json();
  const waves = z.array(WaveSchema).parse(wavesData);
  
  console.log(`Found ${waves.length} waves.`);
  
  const allSubmissions: z.infer<typeof SubmissionSchema>[] = [];

  // 2. Fetch Submissions for each Wave
  for (const wave of waves) {
    console.log(`Fetching submissions for Wave ${wave.waveCount} (${wave.id})...`);
    
    const submissionsRes = await fetch(`${BaseUrl}/wave-hacks/${WaveHackId}/waves/${wave.id}/submissions`);
    if (!submissionsRes.ok) {
      console.error(`Failed to fetch submissions for wave ${wave.id}: ${submissionsRes.statusText}`);
      continue;
    }
    
    const submissionsData = await submissionsRes.json();
    const parsed = SubmissionsResponseSchema.parse(submissionsData);
    
    console.log(`  Found ${parsed.submissions.length} submissions.`);
    allSubmissions.push(...parsed.submissions);
  }
  
  // Filter hidden submissions (where product.isPublic is false)
  const visibleSubmissions = allSubmissions;

  // 3. Report
  console.log("\n--- Summary ---");
  console.log(`Total Submissions Fetched: ${allSubmissions.length}`);
  console.log(`Visible Submissions: ${visibleSubmissions.length}`);
  
  console.log("\n--- Submissions ---");
  visibleSubmissions.forEach((sub, idx) => {
    console.log(JSON.stringify(sub))
    console.log(`${idx + 1}. [${sub.product.name}] - ${sub.product.tagline || "No tagline"}`);
    console.log(`   Repo: ${sub.product.githubRepositoryName || "N/A"}`);
    console.log(`   Wave: ${sub.waveId}`);
    console.log(`   Date: ${sub.createdAt}`);
    console.log(`   Public: ${sub.product.isPublic}`);
    console.log("");
  });
}

fetchAllSubmissions().catch(console.error);
