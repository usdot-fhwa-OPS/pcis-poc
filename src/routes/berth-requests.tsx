import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes } from "aws-amplify/auth";
import { useEffect, useState } from "react";

import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute('/berth-requests')({
  component: BerthRequestComponent,
})

export function BerthRequestComponent() {
  
  return (
  <>
    <div className="flex flex-col w-full px-6 pt-6 md:px-10 md:pt-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Berth Reservations</h1>
        {AddNewBerthRequestButton()}
      </div>
    </div>
  </>
  )
}

function AddNewBerthRequestButton() {

  const { user } = useAuthenticator();
  //const [loading, setLoading] = useState(true)
  const [userAttributes, setUserAttributes] = useState<{ role: string; email: string }>({
    role: '',
    email: '',
  });

   //const brReqList = useAppSelector(getBerthRequestList);

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