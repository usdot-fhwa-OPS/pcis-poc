import { createFileRoute } from '@tanstack/react-router'
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';

interface UserAttributes {
  given_name?: string;
  family_name?: string;
  'custom:role'?: string;
}

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const { user } = useAuthenticator();
    const [userAttributes, setUserAttributes] = useState<{ fullName: string; role: string }>({ fullName: '', role: '' });
    
    useEffect(() => {
      const getUserAttributes = async () => {
        try {
          const attributes: UserAttributes = await fetchUserAttributes();
          
          const fullName = attributes.given_name && attributes.family_name
            ? `${attributes.given_name} ${attributes.family_name}`
            : 'Unknown';
  
          setUserAttributes({
            fullName,
            role: attributes['custom:role'] ?? 'No role assigned',
          });
        } catch (error) {
          console.error('Error fetching user attributes:', error);
        }
      };
  
      if (user) {
        getUserAttributes();
      }
    }, [user]);

    const dateString = new Date().toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  
    return (
      <div className="p-2" style={{ textAlign: 'left' }}>
        <div>
          <p
            style={{
              fontWeight: 400,
              fontSize: '40px'
            }}
          >
            Welcome {userAttributes.fullName}
          </p>
          <p
            style={{
              opacity: 0.66,
              fontWeight: 400,
              fontSize: '24px'
            }}
          >
            {userAttributes.role}
          </p>
        </div>
        <div>
          <p
            style={{
              opacity: 0.66,
              fontWeight: 400,
              fontSize: '14px'
            }}
          >
            {dateString}
          </p>
        </div>
      </div>
    );
}
