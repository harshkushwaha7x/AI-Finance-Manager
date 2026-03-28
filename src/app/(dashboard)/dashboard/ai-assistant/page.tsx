import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function AiAssistantPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="AI assistant"
      title="Add a context-aware finance co-pilot"
      description="The assistant route is already scoped for thread history, contextual prompts, and structured reply cards once the model layer is integrated."
      highlights={[
        "Persistent chat threads",
        "Finance-aware prompt suggestions",
        "Context builder for recent activity",
        "Streaming response experience",
      ]}
      primaryAction="Build chat interface"
      secondaryAction="Integrate OpenAI responses"
    />
  );
}
