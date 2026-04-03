import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes } from "aws-amplify/auth";
import { useEffect, useState } from "react";

import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute('/berth-requests')({
  component: BerthRequestComponent,
})

function BerthRequestComponent() {
  
  return (
  <>
    <div className="flex flex-col w-full p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Berth Requests</h1>
        {AddNewBerthRequestButton()}
      </div>
    </div>
  </>
  )
}

function AddNewBerthRequestButton() {

  const { user } = useAuthenticator();

  const [userAttributes, setUserAttributes] = useState<{ role: string; email: string }>({
    role: '',
    email: '',
  });

  const navigate = useNavigate();
  const navigateToBerthRequestAdd = () => {
    navigate({ to: "/berth-request-add" });
  }
  
  useEffect(() => {
    async function getUserAttributes() {
      if (user) {
        try {
          const attributes = await fetchUserAttributes();
          const roleAttribute = attributes['custom:role'] ?? 'No role assigned';
          setUserAttributes({
            role: roleAttribute,
            email: attributes.email ?? 'No email found',
          });
        } catch (error) {
          console.error('Error fetching user attributes', error);
        }
      }
    }

    getUserAttributes();
  }, [user]);
  
  if (userAttributes.role === "Vessel Agent") {

    return(
      <>
        <div>
          <Button onClick={navigateToBerthRequestAdd}>
            <Plus /> Add New Berth Request
          </Button>
        </div>
      </>
    )

  }
}