import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import WebcamCapture from "../components/WebcamCapture";
import { mlService } from "../services/mlService";
import useAuthStore from "../store/authStore";

export default function FaceRegistration() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const capturedFileRef = useRef(null);

  const onCaptured = (_blob, file) => {
    capturedFileRef.current = file;
  };

  const handleSave = async () => {
    if (!capturedFileRef.current) {
      toast({
        title: "No photo",
        description: "Capture a face photo first",
        variant: "destructive",
      });
      return;
    }
    try {
      setSaving(true);
      await mlService.registerFace(capturedFileRef.current);
      await refreshProfile().catch(() => {});
      toast({
        title: "Face Registered",
        description: "Your face has been linked successfully.",
      });
      const role = JSON.parse(localStorage.getItem("user"))?.role;
      navigate(role === "admin" ? "/admin" : "/dashboard");
    } catch (e) {
      toast({
        title: "Failed to link face",
        description: e.response?.data?.message || e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    const role = user?.role || JSON.parse(localStorage.getItem("user"))?.role;
    navigate(role === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Complete Face Registration</CardTitle>
            <CardDescription>
              Allow camera access and capture a clear photo of your face.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <WebcamCapture
                facingMode="user"
                onCapture={onCaptured}
                width={640}
                height={480}
                autoStart={true}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleSkip}>
                  Skip for now
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save & Continue"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
