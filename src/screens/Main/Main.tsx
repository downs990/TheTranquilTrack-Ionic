import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export const Main = (): JSX.Element => {
  const navigate = useNavigate();
 
  return (
    <div className="bg-[#141414] flex flex-row justify-center w-full">
      <div className="bg-[#141414] w-[390px] h-[754px]">
        <div className="relative h-[754px] bg-[url(/3.jpg)] bg-cover bg-[50%_50%]">
          <Card className="absolute w-[274px] top-[100px] left-[39px] border-none bg-transparent">
            <CardContent className="p-0">
              <div className="relative">
                <div className="text-white text-[32px] font-['Viga',Helvetica] font-normal mb-2">
                  The Tranquil Track
                </div>
                <div className="w-[126px] h-[33px] bg-[#e6fe58] rounded-lg flex items-center justify-center"> 
                  <span className="text-black text-2xl font-['Viga',Helvetica] font-normal">DO IT NOW</span>
                </div>
              </div>
            </CardContent>
          </Card> 

          <div className="absolute top-[200px] left-[42px] font-['Segoe_UI-Regular',Helvetica] font-normal text-white text-sm tracking-[0] leading-normal">
            Achieve your fitness goals with our virtual <br />
            AI trainer! Join us for personalized workouts <br />
            that get results
          </div>

          <div className="absolute w-[309px] h-[59px] top-[630px] left-[39px] bg-[#d9d9d926] rounded-[23px] flex items-center justify-between px-[15px]">
            <Button
              variant="ghost"
              className="w-[131px] h-[41px] bg-[#d9d9d926] rounded-[23px] text-white font-['Segoe_UI-Regular',Helvetica] text-[15px] hover:bg-[#d9d9d940]"
            >
              SIGN UP
            </Button>
            <Button 
              className="w-[131px] h-[41px] bg-[#e6fe58] rounded-[23px] text-black font-['Segoe_UI-Regular',Helvetica] text-[15px] hover:bg-[#d9e64d]"
              onClick={() => navigate('/signup')}
            >
              SIGN IN
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};