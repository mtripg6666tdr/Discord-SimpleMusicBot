import type { CommandInteraction, ComponentInteraction, ComponentInteractionButtonData, ComponentInteractionSelectMenuData, Interaction } from "eris";

import { Constants } from "eris";

export const interactionUtils = {
  interactionIsCommandOrComponent(interaction:Interaction):interaction is CommandInteraction|ComponentInteraction{
    return "channel" in interaction;
  },
  componentInteractionDataIsButtonData(data:ComponentInteractionButtonData|ComponentInteractionSelectMenuData):data is ComponentInteractionButtonData{
    return data.component_type === Constants.ComponentTypes.BUTTON;
  },
  compoentnInteractionDataIsSelectMenuData(data:ComponentInteractionButtonData|ComponentInteractionSelectMenuData):data is ComponentInteractionSelectMenuData{
    return data.component_type === Constants.ComponentTypes.SELECT_MENU;
  },
} as const;
