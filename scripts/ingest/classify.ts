import type { Topic } from '../../src/shared/article.ts'

// Deterministic keyword rules applied to the headline only. The source's own topics always come first;
// rules can add at most one or two secondary topics. Latin rules use word boundaries;
// CJK and Khmer have no spaces between words, so those rules match substrings.
const RULES: ReadonlyArray<{ topic: Topic; patterns: RegExp[] }> = [
  {
    topic: 'ai',
    patterns: [
      /\b(AI|LLMs?|GPT-?\d*|RAG|ML)\b/,
      /\b(artificial intelligence|machine learning|neural network|language models?|generative|deep learning|diffusion model)\b/i,
      /(人工智能|大模型|机器学习|인공지능|머신러닝|딥러닝|생성형|បញ្ញាសិប្បនិម្មិត)/,
    ],
  },
  {
    topic: 'cybersecurity',
    patterns: [
      /\bCVE-\d{4}-\d{4,}\b/i,
      /\b(vulnerabilit(y|ies)|exploit(ed|s)?|ransomware|malware|phishing|zero-day|data breach|backdoor|botnet)\b/i,
      /(漏洞|网络安全|勒索软件|恶意软件|취약점|보안|랜섬웨어|악성코드|សន្តិសុខ)/,
    ],
  },
  {
    topic: 'programming-languages',
    patterns: [/\b(Rust|Python|TypeScript|JavaScript|Golang|Kotlin|Java|C\+\+|Zig|WebAssembly|Ruby|PHP)\b/],
  },
  {
    topic: 'cloud-infrastructure',
    patterns: [
      /\b(Kubernetes|Docker|serverless|AWS|Azure|GCP|Google Cloud|Terraform|containers?)\b/i,
      /(云原生|容器|쿠버네티스|클라우드|컨테이너)/,
    ],
  },
  {
    topic: 'mobile-hardware',
    patterns: [
      /\b(iPhone|iPad|Android|smartphones?|GPUs?|CPUs?|chips?|processors?|semiconductors?|laptops?|wearables?)\b/i,
      /(芯片|手机|半导体|스마트폰|반도체|칩)/,
    ],
  },
  {
    topic: 'developer-tools',
    patterns: [/\b(IDE|VS Code|GitHub|CLI|compiler|debugger|SDK|npm|CI\/CD|open[- ]source)\b/i, /(开源|开发者工具|개발자 도구|오픈소스)/],
  },
  {
    topic: 'startups-products',
    patterns: [/\b(startup|raises \$|funding round|Series [A-E]|seed round|acquires|acquisition)\b/i, /(融资|创业|스타트업|투자 유치)/],
  },
]

export const MAX_TOPICS = 3

export function classify(title: string, sourceTopics: readonly Topic[]): Topic[] {
  const topics: Topic[] = [...sourceTopics]
  for (const rule of RULES) {
    if (topics.length >= MAX_TOPICS) break
    if (topics.includes(rule.topic)) continue
    if (rule.patterns.some((p) => p.test(title))) topics.push(rule.topic)
  }
  return topics
}
