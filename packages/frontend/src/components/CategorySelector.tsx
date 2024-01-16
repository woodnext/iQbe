import { Category } from "@/types";
import { CloseButton, Combobox, Input, InputBase, ScrollArea, Text, useCombobox } from "@mantine/core";

interface Props {
  data: Category[] | undefined,
  value?: string,
  onChange?: (value: string | null) => void,
  label?: string,
  placeholder?: string,
}

export default function({
  data,
  value,
  onChange = () => {},
  label,
  placeholder,
}: Props) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const options = data?.map(({ id, name, description }) => (
    <Combobox.Option value={String(id)} key={id}>
      <Text size="sm">{name}</Text>
      <Text size="xs" opacity={0.65}>
        {description}
      </Text>
    </Combobox.Option>
  ));

  const display = data?.filter(({ id }) => value == String(id))[0]?.name;

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        onChange(val);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          label={label}
          component="button"
          type="button"
          pointer
          rightSection={
            value !== null ? (
              <CloseButton
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChange("")}
                aria-label="Clear value"
              />
            ) : (
              <Combobox.Chevron/>
            )
          }
          onClick={() => combobox.toggleDropdown()}
          rightSectionPointerEvents="none"
        >
          { display || <Input.Placeholder>{placeholder || 'Pick value'}</Input.Placeholder>}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          <ScrollArea.Autosize type="scroll" mah={200}>
            {options}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}