import { ComponentProps, useState } from "react";
import { ActionIcon, Button, Checkbox, Divider, Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlaylistAdd, IconPlus } from "@tabler/icons-react";
import classes from "./styles/QuizMylistButton.module.css";
import { MylistInformation } from "@/types";
import axios from "@/plugins/axios";
import { useIsMobile } from "@/contexts/isMobile";
import MylistCreateModal from "./MylistCreateModal";

interface Props extends ComponentProps<typeof Button> {
  quizId: number,
  registerdMylistId: string[],
  mylists: MylistInformation[],
}

export default function QuizMylistButton({
  quizId,
  registerdMylistId,
  mylists,
}: Props) {
  const [ creating, create ] = useDisclosure(false);
  const [ selectedMyListIdx, setSelectedMylistIdx ] = useState(registerdMylistId.map(id => mylists?.findIndex(list => list.mid == id)));
  const isMobile = useIsMobile();

  const createMylist = async (mylistname: string) => {
    const newMyList = await axios.post<MylistInformation>('/mylists', {
      listName: mylistname,
    }).then(res => res.data);

    await axios.put('/mylists/quiz', {
      quizId,
      mid: newMyList.mid,
    })
  }

  const saveToList = async (mid: string, arrayIdx: number) => {
    if (!selectedMyListIdx.includes(arrayIdx)) { // add to mylist
      await axios.put('/mylists/quiz', {
        quizId,
        mid,
      });
      setSelectedMylistIdx([...selectedMyListIdx, arrayIdx]);
    } else {
      await axios.delete('/mylists/quiz', {
        data: {
          quizId,
          mid,
      }});
      setSelectedMylistIdx(selectedMyListIdx.filter(idx => idx != arrayIdx));
    }
  }

  const defaultButton = (
    <Button
      classNames={{root: classes.button}}
      leftSection={<IconPlaylistAdd />}
      variant="outline"
      size="xs"
      bg="#fff"
    >Save</Button>
  );

  const mobileButton = (
    <ActionIcon
      size="md" 
      color="blue"
      variant="light"
    >
      <IconPlaylistAdd/>
    </ActionIcon>
  );

  return (
    <>
      <MylistCreateModal 
        opened={creating} 
        onClose={create.close}
        onCreate={createMylist}
        zIndex={50}
      />
      <Menu 
        shadow="sm" 
        width={200} 
        position="right-start"
        withinPortal
        closeOnItemClick={false}
      >
        <Menu.Target>
          { isMobile ? mobileButton : defaultButton }
        </Menu.Target>
        <Menu.Dropdown>
          {
            mylists?.map((m, idx) => 
              <Menu.Item 
                key={m.mid}
              >
                <Checkbox
                  label={m.name}
                  checked={selectedMyListIdx.includes(idx)}
                  onChange={() => saveToList(m.mid, idx)}
                />
              </Menu.Item>
            )
          }
          <Divider/>
          <Menu.Item 
            leftSection={<IconPlus size={14}/>}
            onClick={create.open}
          >
            マイリストを作成
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
    
  );
}