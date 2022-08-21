import type { CommandInteraction, ComponentInteraction, ComponentInteractionButtonData, ComponentInteractionSelectMenuData, Interaction } from "eris";

import { Constants } from "eris";

export const interactionUtils = {
  interactionIsCommandInteraction(interaction:Interaction):interaction is CommandInteraction{
    return interaction.type === Constants.InteractionTypes.APPLICATION_COMMAND;
  },
  interactionIsComponentInteraction(interaction:Interaction):interaction is ComponentInteraction{
    return interaction.type === Constants.InteractionTypes.MESSAGE_COMPONENT;
  },
  componentInteractionDataIsButtonData(data:ComponentInteractionButtonData|ComponentInteractionSelectMenuData):data is ComponentInteractionButtonData{
    return data.component_type === Constants.ComponentTypes.BUTTON;
  },
  compoentnInteractionDataIsSelectMenuData(data:ComponentInteractionButtonData|ComponentInteractionSelectMenuData):data is ComponentInteractionSelectMenuData{
    return data.component_type === Constants.ComponentTypes.SELECT_MENU;
  },
} as const;
