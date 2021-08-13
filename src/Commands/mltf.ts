import { CommandArgs, CommandInterface } from ".";
import { CommandLike } from "../Component/CommandLike";
import { log } from "../Util/util";

export default class Mltf implements CommandInterface {
  name = "最後の曲を先頭へ";
  alias = ["movelastsongtofirst", "mlstf", "ml", "mltf", "mlf", "m1"];
  description = "キューの最後の曲をキューの先頭に移動します。";
  unlist = false;
  category = "playlist";
  async run(message:CommandLike, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].Queue.length <= 2){
      message.channel.send("キューに3曲以上追加されているときに使用できます。").catch(e=>log(e, "error"));
      return;
    }
    const q = options.data[message.guild.id].Queue;
    q.Move(q.length - 1, options.data[message.guild.id].Manager.IsPlaying ? 1 : 0);
    const info = q.get(1);
    message.channel.send("✅`" + info.BasicInfo.Title + "`を一番最後からキューの先頭に移動しました").catch(e => log(e, "error"));
  }
}