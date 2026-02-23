import { useParams } from "react-router-dom";
import ComingSoon from "./ComingSoon";
import WorkSpacePage from "./WorkSpacePage";
import AppLayout from "@/components/layout/AppLayout";

const ACTIVE_SPACES: Record<string, React.ComponentType> = {
  work: WorkSpacePage,
};

const SpaceRouter = () => {
  const { spaceKey } = useParams<{ spaceKey: string }>();
  const ActivePage = spaceKey ? ACTIVE_SPACES[spaceKey] : undefined;

  if (ActivePage) {
    return (
      <AppLayout>
        <ActivePage />
      </AppLayout>
    );
  }

  return <ComingSoon />;
};

export default SpaceRouter;
