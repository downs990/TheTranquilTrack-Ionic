import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export const SignUp = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#141414] flex flex-row justify-center w-full">
      <div className="bg-[#141414] w-[390px] h-[754px]">
        <div className="relative h-[754px] bg-[url(/edgar-chaparro-shfo3woggtu-unsplash-1.png)] bg-cover bg-[50%_50%]">
          <Card className="absolute w-[310px] top-[200px] left-[39px] border-none bg-[#ffffff1a] backdrop-blur-md p-6 rounded-xl">
            <CardContent className="p-0">
              <h2 className="text-white text-2xl font-['Viga',Helvetica] mb-6">Sign In</h2>
              <div className="space-y-4">
                
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-3 rounded-lg bg-[#ffffff26] text-white placeholder-gray-400 outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-3 rounded-lg bg-[#ffffff26] text-white placeholder-gray-400 outline-none"
                />
                <Button 
                  className="w-full h-[41px] bg-[#e6fe58] rounded-[23px] text-black font-['Segoe_UI-Regular',Helvetica] text-[15px] hover:bg-[#d9e64d]"
                  onClick={() => navigate('/profile')}
                >
                  SIGN IN
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-[41px] bg-[#d9d9d926] rounded-[23px] text-white font-['Segoe_UI-Regular',Helvetica] text-[15px] hover:bg-[#d9d9d940]"
                  onClick={() => navigate('/')}
                >
                  BACK TO HOME
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};