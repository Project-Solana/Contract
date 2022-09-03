import './App.css';
import {useEffect,useState} from 'react';  

import idl from './idl.json';
import {Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {Program, AnchorProvider, web3, utils ,BN} from '@project-serum/anchor';
import {Buffer} from 'buffer';
window.Buffer = Buffer;   



const amounttopay = new BN( 0.2 * web3.LAMPORTS_PER_SOL);
const slotsbooked = new BN(1);
const timebooked = new BN(1);


const programID =new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');
const opts ={
  prefLightCommitment: 'processed',
};

const {SystemProgram} = web3;





const App = () => {
  

  const [walletAddress,setWalletAddress] = useState(null);
  const [campaigns,setCampaigns] = useState([]);

  const getProvider = () => {
    const connection = new Connection( network, opts.prefLightCommitment);
    const provider = new AnchorProvider( connection, window.solana, opts.prefLightCommitment);

    return provider;
  }


 
  const checkIfWalletIsConnected= async() =>{ 
    try{ 
  
      const {solana} = window;   
      if(solana){ 
        if(solana.isPhantom){ 
          console.log("Wallet Found");

          const response = await solana.connect({onlyIfTrusted: true}); 
           
          console.log("connected with publickey:", response.publicKey.toString());   
          setWalletAddress(response.publicKey.toString()); 
        }; } 
      else{ 
        console.log("Get a phantom wallet") 
      } 
    } 
    catch(error){ 
      console.error(error) 
    } 
  }; 



  const connectWallet = async () => {
    const {solana} = window;
    if (solana){
      const response =await  solana.connect();
      console.log("connected with public key", response.publicKey);
      setWalletAddress(response.publicKey.toString()); 
    }

  };

 

  const getCampaign = async () => {

    const connection = new  Connection( network, opts.prefLightCommitment);
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
 
    Promise.all(

      (await connection.getProgramAccounts(programID)).map(
    
        async campaign => ({
          
          ...( await program.account.campaign.fetch(campaign.pubkey)),
               pubkey: campaign.pubkey,
    })
    )
    
    ).then( (campaigns)=> setCampaigns(campaigns));

    campaigns.map(campaign => console.log(campaign))


  };






  const createCampaign = async () => {
    try{
      const provider =  getProvider();

      const program = new Program(idl, programID, provider);
      
      const [campaign] = await PublicKey.findProgramAddress(
      [
        utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
        provider.wallet.publicKey.toBuffer(),
      ],
       program.programId
      );

      await program.rpc.create("name",new BN(10) , {
        accounts:{
          campaign,
          user: provider.wallet.publicKey,
          systemProgram:  SystemProgram.programId,
        },
       });    

        console.log("Create a new campaign account", campaign.toString());
    }catch(error){

      console.log('Error creating campaign account', error)
    }
  };



    const donate = async publicKey =>{
      try {

        const provider = getProvider();
        const program = new Program(idl, programID, provider)

        const amounttopay = new BN( 0.2 * web3.LAMPORTS_PER_SOL);
        const slotsbooked = new BN(1);
        const timebooked = new BN(1);


        await program.rpc.donate( amounttopay, slotsbooked, {
          accounts:{
            campaign: publicKey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          }
        });

        console.log("Donate amount to", publicKey.toString());
        getCampaign();

      }catch(error) {
        console.error(error);
      } 



    }






  const withdraw = async publicKey =>{
    try{
      const provider = getProvider();
      const program = new Program(idl, programID, provider)
      await program.rpc.withdraw(new BN( 0.2 * web3.LAMPORTS_PER_SOL), {
        accounts:{
          campaign: publicKey,
          user: provider.wallet.publicKey,
        }
      });
      console.log("Withdraw money:",publicKey.toString());

    }catch(error){
      console.error("Error withdrawing", error);
    }
  }


useEffect(()=>{

  const onLoad = async () => {
  await checkIfWalletIsConnected(); 
};

window.addEventListener("load",onLoad);
return () => window.removeEventListener("load",onLoad);
}, []);
  



return <div className="App"><button onClick={connectWallet}>Connect to wallet. </button> <button onClick={createCampaign}>Connect a Campaign. </button>
<br/>


<button onClick={getCampaign}>Get Campaigns</button>

<br/>
{campaigns.map(campaign => 
  <> 
  <p> Campaign ID: {campaign.pubkey.toString()}
  </p>
  <p>
    Balance: {(campaign.amountDonated / web3.LAMPORTS_PER_SOL).toString()}
  </p>
  <p>
    Name {campaign.name}
  </p>
  
  <p>
    Slots {campaign.description.toString()}
  </p>
  <button onClick={() => donate(campaign.pubkey)}>Donate</button>
  <button onClick={() => withdraw(campaign.pubkey)}>Withdraw.</button>
  <br/> 
 
  </>
)}

<br/> 
  <br/> 

<div className="person">
<h1>ID</h1>
<h1>Slot Booked: {slotsbooked.toString()}</h1>
<h1>DAY</h1>
<h1>Time(in hours): {timebooked.toString()}</h1>
<h1>Amount donated: {(amounttopay/ web3.LAMPORTS_PER_SOL).toString()}</h1>


</div>


</div>;

};


export default App;
